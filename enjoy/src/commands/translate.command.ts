import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "langchain/prompts";
import { HttpsProxyAgent } from "https-proxy-agent";

export const translateCommand = async (
  text: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
    proxy?: string;
  }
): Promise<string> => {
  const {
    key,
    modelName = "gpt-3.5-turbo-1106",
    temperature = 0,
    baseUrl,
    proxy,
  } = options;

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName,
    temperature,
    configuration: {
      baseURL: baseUrl,
      httpAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
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
