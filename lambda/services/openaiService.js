const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Snowball, a friendly voice assistant on Alexa. Follow these rules:
1. Keep responses SHORT and conversational - 2-3 sentences max for simple questions
2. No bullet points, lists, or special formatting - speak naturally
3. Avoid technical jargon unless asked
4. If a topic is complex, give a brief summary and offer to explain more
5. Be warm and helpful, suitable for all ages including children`;

const MAX_RESPONSE_LENGTH = 6000; // Alexa limit is ~8000, leave buffer

/**
 * Send messages to OpenAI chat completion API
 * @param {Array<{role: string, content: string}>} messages - Array of message objects with role and content
 * @param {string} userId - User identifier (for logging/tracking purposes)
 * @returns {Promise<{response: string, tokensUsed: number}>} The assistant's response and total tokens used
 */
async function chat(messages, userId) {
  try {
    const messagesWithSystem = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: messagesWithSystem,
      max_tokens: 300, // Limit response length
    });

    let response = completion.choices[0]?.message?.content || '';

    // Truncate if still too long (safety net)
    if (response.length > MAX_RESPONSE_LENGTH) {
      response = response.substring(0, MAX_RESPONSE_LENGTH) + '... Would you like me to continue?';
    }

    const tokensUsed = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);

    return {
      response,
      tokensUsed,
    };
  } catch (error) {
    console.error(`OpenAI API error for user ${userId}:`, error.message);
    throw new Error(`Failed to get response from OpenAI: ${error.message}`);
  }
}

module.exports = {
  chat,
};
