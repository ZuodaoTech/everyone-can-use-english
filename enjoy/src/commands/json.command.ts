import { ChatOpenAI } from "@langchain/openai";
import { RESPONSE_JSON_FORMAT_MODELS } from "@/constants";

export const jsonCommand = async (
  prompt: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
    schema: any;
  }
): Promise<any> => {
  const { key, temperature = 0, baseUrl, schema } = options;
  let { modelName = "gpt-4-turbo" } = options;

  if (RESPONSE_JSON_FORMAT_MODELS.indexOf(modelName) === -1) {
    modelName = "gpt-4-turbo";
  }

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName,
    temperature,
    configuration: {
      baseURL: baseUrl,
    },
    modelKwargs: {
      response_format: {
        type: "json_object",
      },
    },
    cache: true,
    verbose: true,
    maxRetries: 2,
  });

  return chatModel.withStructuredOutput(schema).invoke(prompt);
};
