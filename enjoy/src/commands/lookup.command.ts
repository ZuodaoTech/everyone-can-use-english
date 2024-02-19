import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import {
  StructuredOutputParser,
  OutputFixingParser,
} from "langchain/output_parsers";

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
    modelName = "gpt-3.5-turbo-1106",
    temperature = 0,
    baseUrl,
  } = options;
  const { word, context, meaningOptions } = params;

  const responseSchema = z.object({
    id: z.string().optional(),
    word: z.string().optional(),
    context_translation: z.string().optional(),
    pos: z.string().optional(),
    pronunciation: z.string().optional(),
    definition: z.string().optional(),
    translation: z.string().optional(),
    lemma: z.string().optional(),
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
    cache: true,
    verbose: true,
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
      definitions: meaningOptions,
    }),
  });

  try {
    return await parser.parse(response.text);
  } catch (e) {
    return await fixParser.parse(response.text);
  }
};

const DICITIONARY_PROMPT = `You are an {learning_language}-{native_language} dictionary. I will provide "word(it also maybe a phrase)" and "context" as input, you should return the "word", "lemma", "pronunciation", "pos(part of speech, maybe empty for phrase)", "definition", "translation" and "context_translation" as output. If I provide "definitions", you should try to select the appropriate one for the given context, and return the id of selected definition as "id". If none are suitable, generate a new definition for me. If no context is provided, return the most common definition. If you do not know the appropriate definition, return an empty string for "definition" and "translation".
      Always return output in JSON format.
      
      # Example 1, with empty definitions
      <input>
        {{
          "word": "booked",
          "context": "She'd *booked* a table for four at their favourite restaurant.",
          "definitions": []
        }}
      </input>
      
      <output> 
      {{
        "word": "booked",
        "lemma": "book",
        "pronunciation": "bʊk",
        "pos": "verb",
        "definition": "to arrange to have a seat, room, performer, etc. at a particular time in the future",
        "translation": "预订",
        "context_translation": "她已经在他们最喜欢的餐厅预订了四人桌位。"
      }}
      </output> 
      
      # Example 2, with definitions
      <input>
      {{
        "word": "booked",
        "context": "She'd *booked* a table for four at their favourite restaurant.",
        "definitions": [
          {{
            "id": "767ddbf3-c08a-42e1-95c8-c48e681f3486",
            "pos": "noun",
            "definition": "a written text that can be published in printed or electronic form",
          }},
          {{
            "id": "37940295-ef93-4873-af60-f03bf7e271f0",
            "pos": "verb",
            "definition": "to arrange to have a seat, room, performer, etc. at a particular time in the future",
          }}
        ]
      }}
      </input>
      
      <output>
        {{
          "id": "37940295-ef93-4873-af60-f03bf7e271f0",
          "context_translation": "她已经在他们最喜欢的餐厅预订了四人桌位。"
        }}
      </output> 
  `;
