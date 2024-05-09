import { ChatOpenAI } from "@langchain/openai";
import { RESPONSE_JSON_FORMAT_MODELS } from "@/constants";
import { zodToJsonSchema } from "zod-to-json-schema";

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
    cache: true,
    verbose: true,
    maxRetries: 1,
  });

  const structuredOutput = chatModel.withStructuredOutput(
    zodToJsonSchema(schema),
    {
      method: "jsonMode",
    }
  );

  return structuredOutput.invoke(prompt);
};
