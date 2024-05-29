import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { jsonCommand } from "./json.command";

export const ipaCommand = async (
  text: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<{ words?: { word?: string; ipa?: string }[] }> => {
  if (!text) throw new Error("Text is required");

  const schema = z.object({
    words: z.array(
      z.object({
        word: z.string().min(1),
        ipa: z.string().min(1),
      })
    ),
  });

  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{text}"],
  ]).format({
    learning_language: "English",
    text,
  });

  return jsonCommand(prompt, { ...options, schema });
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
