const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = "I'm Snowball, your AI assistant. Just ask me anything! For example, say 'what is the moon' or 'tell me about Paris'.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("What would you like to know?")
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
        const speakOutput = "I didn't catch that. Try asking something like 'what is the moon' or 'tell me about dinosaurs'.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("What would you like to know?")
            .getResponse();
    }
};

module.exports = {
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler
};
