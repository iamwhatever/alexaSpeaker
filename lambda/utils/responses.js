/**
 * Helper functions for building Alexa responses
 */

/**
 * Returns a response with speech only
 * @param {Object} handlerInput - The Alexa handler input
 * @param {string} speechText - The text to speak
 * @returns {Object} Alexa response
 */
function speak(handlerInput, speechText) {
    return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
}

/**
 * Returns a response with speech and reprompt
 * @param {Object} handlerInput - The Alexa handler input
 * @param {string} speechText - The text to speak
 * @param {string} repromptText - The text to use for reprompt
 * @returns {Object} Alexa response
 */
function speakWithReprompt(handlerInput, speechText, repromptText) {
    return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .getResponse();
}

/**
 * Returns a response that ends the session
 * @param {Object} handlerInput - The Alexa handler input
 * @param {string} speechText - The text to speak before ending
 * @returns {Object} Alexa response
 */
function endSession(handlerInput, speechText) {
    return handlerInput.responseBuilder
        .speak(speechText)
        .withShouldEndSession(true)
        .getResponse();
}

module.exports = {
    speak,
    speakWithReprompt,
    endSession
};
