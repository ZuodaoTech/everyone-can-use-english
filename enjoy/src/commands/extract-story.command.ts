import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { jsonCommand } from "./json.command";
import { LANGUAGES } from "@/constants";

export const extractStoryCommand = async (
  text: string,
  learningLanguage: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<{ words: string[]; idioms: string[] }> => {
  const schema = z.object({
    words: z.array(z.string().describe("extracted word")),
    idioms: z.array(z.string().describe("extracted idiom")),
  });

  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", EXTRACT_STORY_PROMPT],
    ["human", "{text}"],
  ]).format({
    learning_language: LANGUAGES.find((l) => l.code === learningLanguage).name,
    text,
  });

  return jsonCommand(prompt, { ...options, schema });
};

const EXTRACT_STORY_PROMPT = `
I am an {learning_language} beginner and only have a grasp of 500 high-frequency basic words. You are an {learning_language} learning assistant robot, and your task is to analyze the article I provide and extract all the meaningful words and idioms that I may not be familiar with. Specifically, it should include common words used in uncommon ways. Return in JSON format like following:

{{
  words: ["word1", "word2", ...],
  idiom: ["idiom1", "idiom2", ...]
}}
`;
