import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "langchain/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { HttpsProxyAgent } from "https-proxy-agent";

export const extractStoryCommand = async (
  content: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
    proxy?: string;
  }
): Promise<{ words: string[]; idioms: string[] }> => {
  const {
    key,
    modelName = "gpt-3.5-turbo-1106",
    temperature = 0,
    baseUrl,
    proxy,
  } = options;

  const saveExtraction = z.object({
    words: z.array(z.string().describe("extracted word")),
    idioms: z.array(z.string().describe("extracted idiom")),
  });

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName,
    temperature,
    modelKwargs: {
      response_format: {
        type: "json_object",
      },
    },
    configuration: {
      baseURL: baseUrl,
      httpAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
    },
    cache: true,
    verbose: true,
  }).bind({
    tools: [
      {
        type: "function",
        function: {
          name: "save_extraction",
          description: "Save the extracted words and idioms from a text",
          parameters: zodToJsonSchema(saveExtraction),
        },
      },
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", EXTRACT_STORY_PROMPT],
    ["human", "{text}"],
  ]);

  const response = await prompt.pipe(chatModel).invoke({
    learning_language: "English",
    text: content,
  });

  return JSON.parse(
    response.additional_kwargs?.tool_calls?.[0]?.function?.arguments || "{}"
  );
};

const EXTRACT_STORY_PROMPT = `
I am an {learning_language} beginner and only have a grasp of 500 high-frequency basic words. You are an {learning_language} learning assistant robot, and your task is to analyze the article I provide and extract all the meaningful words and idioms that I may not be familiar with. Specifically, it should include common words used in uncommon ways. Return in JSON format.
`;
