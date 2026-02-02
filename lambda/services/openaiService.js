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
async function chat(messages, userId, retries = 2) {
  const messagesWithSystem = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesWithSystem,
        max_tokens: 250, // Keep responses short for voice
      });

      let response = completion.choices[0]?.message?.content || '';

      // Handle empty response
      if (!response || response.trim() === '') {
        if (attempt < retries) {
          console.log(`Empty response, retrying (attempt ${attempt + 1})`);
          continue;
        }
        response = "I'm not sure how to answer that. Could you try asking in a different way?";
      }

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
      console.error(`OpenAI API error (attempt ${attempt + 1}):`, error.message);
      if (attempt === retries) {
        throw new Error(`Failed to get response from OpenAI: ${error.message}`);
      }
      // Wait briefly before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Summarize conversation history to compress context
 * @param {Array<{role: string, content: string}>} messages - Messages to summarize
 * @param {string} existingSummary - Previous summary to incorporate
 * @returns {Promise<{summary: string, tokensUsed: number}>}
 */
async function summarizeConversation(messages, existingSummary = '') {
  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = existingSummary
    ? `Previous summary: ${existingSummary}\n\nNew conversation:\n${conversationText}\n\nCreate a brief updated summary (2-3 sentences) capturing key topics and context.`
    : `Conversation:\n${conversationText}\n\nCreate a brief summary (2-3 sentences) capturing key topics and context.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a summarizer. Create very brief summaries of conversations.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
    });

    const summary = completion.choices[0]?.message?.content || existingSummary;
    const tokensUsed = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);

    return { summary, tokensUsed };
  } catch (error) {
    console.error('Summarization error:', error.message);
    return { summary: existingSummary, tokensUsed: 0 };
  }
}

module.exports = {
  chat,
  summarizeConversation,
};
