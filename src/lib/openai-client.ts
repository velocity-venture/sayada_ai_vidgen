import OpenAI from 'openai';

/**
 * Initializes the OpenAI client with the API key from environment variables.
 * This should only be used on the server-side (API routes, Server Components).
 * @returns {OpenAI} Configured OpenAI client instance.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;