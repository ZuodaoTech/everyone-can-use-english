import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";
import { LANGUAGES } from "@/constants";

export const summarizeTopicCommand = async (
  text: string,
  learningLanguage: string,
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<string> => {
  if (!text) throw new Error("Text is required");

  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", text],
  ]).format({
    learning_language: LANGUAGES.find((l) => l.code === learningLanguage).name,
  });

  return textCommand(prompt, options);
};

const SYSTEM_PROMPT =
  "Please generate a four to five words title summarizing our conversation in {learning_language} without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.";
