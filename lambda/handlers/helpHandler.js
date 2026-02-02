const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = "I'm Snowball, your AI assistant. Start your question with 'Snowball' followed by what you want to know. For example, say 'Snowball, what is the moon?'";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say 'Snowball' followed by your question.")
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = "Please start your question with 'Snowball'. For example, say 'Snowball, tell me about dinosaurs'.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say 'Snowball' followed by your question.")
            .getResponse();
    }
};

module.exports = {
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler
};
