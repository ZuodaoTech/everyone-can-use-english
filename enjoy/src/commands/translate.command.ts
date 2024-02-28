import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RESPONSE_JSON_FORMAT_MODELS } from "@/constants";

export const translateCommand = async (
  text: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<string> => {
  const { key, temperature = 0, baseUrl } = options;
  let { modelName = "gpt-3.5-turbo" } = options;

  if (RESPONSE_JSON_FORMAT_MODELS.indexOf(modelName) === -1) {
    modelName = "gpt-3.5-turbo";
  }

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName,
    temperature,
    configuration: {
      baseURL: baseUrl,
    },
    cache: true,
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

const SYSTEM_PROMPT =
  "You are a professional, authentic translation engine, only returns translations.";
const TRANSLATION_PROMPT = `Translate the text to {native_language} Language, please do not explain my original text.:

{text}
`;
