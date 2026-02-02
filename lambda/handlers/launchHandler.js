const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Ready.')
            .reprompt('What would you like to know?')
            .getResponse();
    }
};

module.exports = { LaunchRequestHandler };
