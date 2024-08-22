import { ChatOpenAI } from "@langchain/openai";
import { NOT_SUPPORT_JSON_FORMAT_MODELS } from "@/constants";
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
  let { modelName = "gpt-4o" } = options;

  if (NOT_SUPPORT_JSON_FORMAT_MODELS.indexOf(modelName) > -1) {
    modelName = "gpt-4o";
  }

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
    },
    verbose: true,
    maxRetries: 1,
  });

  const structuredOutput = chatModel.withStructuredOutput(
    zodToJsonSchema(schema),
    {
      method: "jsonMode",
    }
  );

  const response = await structuredOutput.invoke(prompt);
  return response;
};
