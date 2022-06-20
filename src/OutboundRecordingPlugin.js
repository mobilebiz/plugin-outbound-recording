import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';
import axios from 'axios';

const PLUGIN_NAME = 'OutboundRecordingPlugin';

export default class OutboundRecordingPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  async init(flex, manager) {
    flex.Actions.addListener('afterAcceptTask', async (payload) => {
      if (payload.task.attributes.direction === 'outbound') {
        let conference = null;
        // Waiting a conference object made.
        while (!conference) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Sleep 0.5 seconds
          conference = payload.task.conference || null;
        }
        // Make a hook that participant added to conference.
        conference.source.map.on('itemAdded', async (data) => {
          const callSid = data.item.descriptor.key || '';
          if (callSid) {
            // Start recording for outbound call.
            const { FLEX_APP_FUNCTIONS_DOMAIN, FLEX_APP_ACCOUNT_SID } =
              process.env;
            const url = `https://${FLEX_APP_FUNCTIONS_DOMAIN}/create-recording?callSid=${callSid}`;
            const res = await axios.post(url);
            // Add a attributes for Flex Insights CONVERSATIONS.
            const newAttributes = {
              ...payload.task.attributes,
              conversations: {
                media: [
                  {
                    url: `https://api.twilio.com/2010-04-01/Accounts/${FLEX_APP_ACCOUNT_SID}/Recordings/${res.data.sid}`,
                    type: 'VoiceRecording',
                    start_time: res.data.startTime,
                    channels: ['customer', 'others'],
                  },
                ],
              },
              type: 'outbound',
              call_sid: callSid,
              account_sid: FLEX_APP_ACCOUNT_SID,
              caller: payload.task.attributes.from,
              to: payload.task.attributes.outbound_to,
              name: payload.task.attributes.outbound_to,
            };
            // Update task.
            payload.task.setAttributes(newAttributes);
          }
        });
      }
    });
  }
}
