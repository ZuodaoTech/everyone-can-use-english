import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const analyzeCommand = async (
  text: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<string> => {
  const { key, temperature = 0, baseUrl } = options;
  let { modelName = "gpt-4-turbo-preview" } = options;

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName,
    temperature,
    configuration: {
      baseURL: baseUrl,
    },
    cache: false,
    verbose: true,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", TRANSLATION_PROMPT],
  ]);

  const response = await prompt.pipe(chatModel).invoke({
    native_language: "Chinese",
    text,
  });

  return response.text;
};

const SYSTEM_PROMPT = `You are a language coach of English, and you are helping a student to learn {native_language}.`;
const TRANSLATION_PROMPT = `
{text}

Please analyze the text above, including sentence structure, grammar, and vocabulary/phrases, and provide a detailed explanation of the text. Please reply in {native_language} and return the result only in the following format:

  ### Sentence structure
  (explain every element of the sentence)

  ### Grammar
  (explain the grammar of the sentence)

  ### Vocabulary/phrases 
  (explain the key vocabulary and phrases used)`;
