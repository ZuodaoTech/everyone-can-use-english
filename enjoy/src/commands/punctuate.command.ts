import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const punctuateCommand = async (
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
    maxRetries: 2,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", text],
  ]);

  const response = await prompt.pipe(chatModel).invoke({});

  return response.text;
};

const SYSTEM_PROMPT = `Please add proper punctuation to the text I provide you. Return the corrected text only.`;
