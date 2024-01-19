import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "langchain/prompts";
import { z } from "zod";
import {
  StructuredOutputParser,
  OutputFixingParser,
} from "langchain/output_parsers";

export const ipaCommand = async (
  text: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<{ words?: { word?: string; ipa?: string }[] }> => {
  const {
    key,
    modelName = "gpt-3.5-turbo-1106",
    temperature = 0,
    baseUrl,
  } = options;

  const responseSchema = z.object({
    words: z.array(
      z.object({
        word: z.string().nonempty(),
        ipa: z.string().nonempty(),
      })
    ),
  });

  const parser = StructuredOutputParser.fromZodSchema(responseSchema);
  const fixParser = OutputFixingParser.fromLLM(
    new ChatOpenAI({
      openAIApiKey: key,
      modelName,
      temperature: 0,
      configuration: {
        baseURL: baseUrl,
      },
    }),
    parser
  );

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
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{text}"],
  ]);

  const response = await prompt.pipe(chatModel).invoke({
    learning_language: "English",
    text,
  });

  try {
    return await parser.parse(response.text);
  } catch (e) {
    return await fixParser.parse(response.text);
  }
};

const SYSTEM_PROMPT = `Generate an array of JSON objects for each {learning_language} word in the given text, with each object containing two keys: 'word' and 'ipa', where 'ipa' is the International Phonetic Alphabet (IPA) representation of the word. Return the array in JSON format only. The output should be structured like this:

{{
  words: [
    {{
    word: "word",
    ipa: "ipa"
    }}
  ]
}}`;
