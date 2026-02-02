const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("Hi, I'm Snowball. What would you like to know?")
            .reprompt("Say 'Snowball' followed by your question.")
            .getResponse();
    }
};

module.exports = { LaunchRequestHandler };
