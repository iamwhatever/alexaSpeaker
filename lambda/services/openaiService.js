const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Send messages to OpenAI chat completion API
 * @param {Array<{role: string, content: string}>} messages - Array of message objects with role and content
 * @param {string} userId - User identifier (for logging/tracking purposes)
 * @returns {Promise<{response: string, tokensUsed: number}>} The assistant's response and total tokens used
 */
async function chat(messages, userId) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: messages,
    });

    const response = completion.choices[0]?.message?.content || '';
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
