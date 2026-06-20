import "server-only";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const MODEL_ID = "gemini-2.5-flash";

export type LangChainModelOptions = {
  maxOutputTokens?: number;
};

export function createLangChainModel(
  temperature = 0.1,
  options?: LangChainModelOptions,
) {
  return new ChatGoogleGenerativeAI({
    model: MODEL_ID,
    temperature,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: options?.maxOutputTokens,
  });
}

export const langchainModel = createLangChainModel();

export { MODEL_ID };
