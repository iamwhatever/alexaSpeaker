const { checkTokenLimit, addTokens } = require('../services/tokenTracker');
const { chat } = require('../services/openaiService');

const MAX_HISTORY_LENGTH = 6; // Keep last 3 exchanges (6 messages: 3 user + 3 assistant)

const ChatIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ChatIntent';
    },
    async handle(handlerInput) {
        const userId = handlerInput.requestEnvelope.session.user.userId;
        const query = handlerInput.requestEnvelope.request.intent.slots.query.value;

        if (!query) {
            return handlerInput.responseBuilder
                .speak("I didn't hear a question. What would you like to know?")
                .reprompt("What would you like to know?")
                .getResponse();
        }

        try {
            const tokenStatus = await checkTokenLimit(userId);
            if (!tokenStatus.allowed) {
                return handlerInput.responseBuilder
                    .speak("You've reached your daily limit of tokens. Please try again tomorrow.")
                    .withShouldEndSession(true)
                    .getResponse();
            }

            // Get conversation history from session
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const conversationHistory = sessionAttributes.conversationHistory || [];

            // Add user message to history
            conversationHistory.push({ role: 'user', content: query });

            // Send conversation history to GPT
            const chatResponse = await chat(conversationHistory, userId);
            await addTokens(userId, chatResponse.tokensUsed);

            // Add assistant response to history
            conversationHistory.push({ role: 'assistant', content: chatResponse.response });

            // Keep only recent history to manage token usage
            while (conversationHistory.length > MAX_HISTORY_LENGTH) {
                conversationHistory.shift();
            }

            // Save updated history to session
            sessionAttributes.conversationHistory = conversationHistory;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            return handlerInput.responseBuilder
                .speak(chatResponse.response)
                .reprompt("What else would you like to know?")
                .getResponse();
        } catch (error) {
            console.error('ChatIntent error:', error);
            return handlerInput.responseBuilder
                .speak("Sorry, I couldn't get a response. Please try again.")
                .reprompt("What would you like to know?")
                .getResponse();
        }
    }
};

const RepromptHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionResumedRequest'
            || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent'
                && handlerInput.requestEnvelope.request.dialogState === 'STARTED');
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const repromptCount = sessionAttributes.repromptCount || 0;

        if (repromptCount === 0) {
            sessionAttributes.repromptCount = 1;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            return handlerInput.responseBuilder
                .speak("Still here.")
                .reprompt("Still here.")
                .getResponse();
        } else if (repromptCount === 1) {
            sessionAttributes.repromptCount = 2;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            return handlerInput.responseBuilder
                .speak("Let me know if you need anything else.")
                .reprompt("Let me know if you need anything else.")
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak("Goodbye.")
                .withShouldEndSession(true)
                .getResponse();
        }
    }
};

module.exports = {
    ChatIntentHandler,
    RepromptHandler
};
