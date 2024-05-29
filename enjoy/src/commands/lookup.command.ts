import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { jsonCommand } from "./json.command";
import { LANGUAGES } from "@/constants";

export const lookupCommand = async (
  params: {
    word: string;
    context: string;
    meaningOptions?: Partial<MeaningType>[];
    learningLanguage?: string;
    nativeLanguage?: string;
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
    word,
    context,
    meaningOptions,
    learningLanguage = "en-US",
    nativeLanguage = "zh-CN",
  } = params;

  const schema = z.object({
    id: z.string().optional(),
    word: z.string().optional(),
    context_translation: z.string().optional(),
    pos: z.string().optional(),
    pronunciation: z.string().optional(),
    definition: z.string().optional(),
    translation: z.string().optional(),
    lemma: z.string().optional(),
  });

  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", DICITIONARY_PROMPT],
    ["human", "{input}"],
  ]).format({
    learning_language: LANGUAGES.find((l) => l.code === learningLanguage).name,
    native_language: LANGUAGES.find((l) => l.code === nativeLanguage).name,
    input: JSON.stringify({
      word,
      context,
      definitions: meaningOptions,
    }),
  });

  return jsonCommand(prompt, { ...options, schema });
};

const DICITIONARY_PROMPT = `You are an {learning_language}-{native_language} dictionary. 
I will provide "word(it also maybe a phrase)" and "context" as input, you should return the "word", "lemma", "pronunciation", "pos", "definition", "translation" and "context_translation" as output. 
If no context is provided, return the most common definition.
If you do not know the appropriate definition, return an empty string for "definition" and "translation".
Always return the output in JSON format as following:
      
{{
  "word": "the original word or phrase",
  "lemma": "lemma",
  "pronunciation": "IPA pronunciation",
  "pos": "the part of speech",
  "definition": "the definition in {learning_language}",
  "translation": "translation in {native_language}",
  "context_translation": "translation of the context in {native_language}",
}}`;
