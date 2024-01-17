import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "langchain/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

export const lookupCommand = async (
  params: {
    word: string;
    context: string;
    meaningOptions?: Partial<MeaningType>[];
  },
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<{
  id?: string;
  word?: string;
  context_translation?: string;
  pos?: string;
  pronunciation?: string;
  definition?: string;
  translation?: string;
  lemma?: string;
}> => {
  const {
    key,
    modelName = "gpt-4-1106-preview",
    temperature = 0,
    baseUrl,
  } = options;
  const { word, context, meaningOptions } = params;

  const selectMeaning = z.object({
    id: z.string().describe("the id of the selected meaning"),
    context_translation: z.string().describe("translation of the context"),
  });

  const generateMeaning = z.object({
    word: z.string().describe("the word or phrase to lookup"),
    definition: z.string().describe("the definition of word"),
    pos: z.string().describe("the part of speech"),
    pronunciation: z.string().describe("the pronunciation, in IPA"),
    lemma: z.string().describe("the lemma"),
    translation: z.string().describe("translation of the definition"),
    context_translation: z.string().describe("translation of the context"),
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
    },
    cache: true,
    verbose: true,
  }).bind({
    tools: [
      {
        type: "function",
        function: {
          name: "select_meaning",
          description:
            "Select the appropriate meaning for the word from the options and translate the context",
          parameters: zodToJsonSchema(selectMeaning),
        },
      },
      {
        type: "function",
        function: {
          name: "generate_meaning",
          description:
            "Generate a appropriate meaning and translation of the word",
          parameters: zodToJsonSchema(generateMeaning),
        },
      },
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", DICITIONARY_PROMPT],
    ["human", "{input}"],
  ]);

  const response = await prompt.pipe(chatModel).invoke({
    learning_language: "English",
    native_language: "Chinese",
    input: JSON.stringify({
      word,
      context,
      meaningOptions,
    }),
  });

  try {
    return JSON.parse(
      response.additional_kwargs?.tool_calls?.[0]?.function?.arguments || "{}"
    );
  } catch (e) {
    console.error(e);
    console.log(response);
    return {};
  }
};

const DICITIONARY_PROMPT = `You are a {learning_language}-{native_language} dictionary bot. You are asked to lookup the meaning of a word of phrase in a context. You are given the word and the context. You are also given a list of possible meanings for the word. You have to select the appropriate meaning for the word from the options. If none of the options are appropriate, you have to generate a appropriate meaning of the word and call the given function, providing the appropriate properties. And always translate the context in {native_language}. Return in JSON format.

An example of arguments to generate meaning:

"word": "booked",
"lemma": "book",
"pronunciation": "bʊk",
"pos": "verb",
"definition": "to arrange to have a seat, room, performer, etc. at a particular time in the future",
"translation": "预订",
"context_translation": "她已经在他们最喜欢的餐厅预订了四人桌位。"
`;
