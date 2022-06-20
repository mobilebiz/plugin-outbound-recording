/**
 * Start recording
 */
const Twilio = require('twilio');
exports.handler = async function (context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  try {
    // Got a parameter
    const callSid = event.callSid || '';
    if (!callSid) throw new Error('Parameter error.');

    const twilioClient = Twilio(context.API_KEY, context.API_SECRET, {
      accountSid: context.ACCOUNT_SID,
    });
    const res = await twilioClient.calls(callSid).recordings.create({
      recordingChannels: 'dual',
    });
    response.appendHeader('Content-Type', 'application/json');
    response.setBody(res);
    callback(null, response);
  } catch (err) {
    console.error(err.message ? err.message : err);
    response.appendHeader('Content-Type', 'plain/text');
    response.setBody(err);
    callback(null, response);
  }
};
