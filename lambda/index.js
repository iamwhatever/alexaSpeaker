const Alexa = require('ask-sdk-core');

const { LaunchRequestHandler } = require('./handlers/launchHandler');
const { ChatIntentHandler } = require('./handlers/chatHandler');
const { HelpIntentHandler, CancelAndStopIntentHandler, FallbackIntentHandler } = require('./handlers/helpHandler');
const { SessionEndedRequestHandler, ErrorHandler } = require('./handlers/sessionEndedHandler');

const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ChatIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('alexa-chatgpt-skill/1.0')
    .lambda();

exports.handler = skill;
