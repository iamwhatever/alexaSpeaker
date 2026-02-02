const { checkTokenLimit, addTokens } = require('../services/tokenTracker');
const { chat, summarizeConversation } = require('../services/openaiService');

const MAX_RECENT_MESSAGES = 4; // Keep last 2 exchanges (4 messages)
const SUMMARIZE_THRESHOLD = 8; // Summarize when history exceeds this

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

            // Get conversation history and summary from session
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const conversationHistory = sessionAttributes.conversationHistory || [];
            const conversationSummary = sessionAttributes.conversationSummary || '';

            // Add user message to history
            conversationHistory.push({ role: 'user', content: query });

            // Build messages with summary context if available
            let messagesToSend = [...conversationHistory];
            if (conversationSummary) {
                // Prepend summary as context
                messagesToSend = [
                    { role: 'system', content: `Previous conversation summary: ${conversationSummary}` },
                    ...conversationHistory
                ];
            }

            // Send conversation history to GPT
            const chatResponse = await chat(messagesToSend, userId);
            await addTokens(userId, chatResponse.tokensUsed);

            // Add assistant response to history
            conversationHistory.push({ role: 'assistant', content: chatResponse.response });

            // Summarize if history gets too long
            if (conversationHistory.length > SUMMARIZE_THRESHOLD) {
                try {
                    // Get messages to summarize (all except last 2 exchanges)
                    const toSummarize = conversationHistory.slice(0, -MAX_RECENT_MESSAGES);
                    const recentMessages = conversationHistory.slice(-MAX_RECENT_MESSAGES);

                    // Create summary of older conversation
                    const existingSummary = sessionAttributes.conversationSummary || '';
                    const summaryResult = await summarizeConversation(toSummarize, existingSummary);

                    // Update session with summary and recent messages only
                    sessionAttributes.conversationSummary = summaryResult.summary;
                    sessionAttributes.conversationHistory = recentMessages;
                    await addTokens(userId, summaryResult.tokensUsed);
                } catch (error) {
                    console.error('Summarization error:', error);
                    // Fall back to just keeping recent messages
                    sessionAttributes.conversationHistory = conversationHistory.slice(-MAX_RECENT_MESSAGES);
                }
            } else {
                sessionAttributes.conversationHistory = conversationHistory;
            }

            // Save to session
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
