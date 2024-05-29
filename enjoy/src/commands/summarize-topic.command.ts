import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";
import { LANGUAGES } from "@/constants";

export const summarizeTopicCommand = async (
  text: string,
  nativeLanguage: string,
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
    native_language: LANGUAGES.find((l) => l.code === nativeLanguage).name,
  });

  return textCommand(prompt, options);
};

const SYSTEM_PROMPT =
  "Please generate a four to five word title summarizing our conversation in {native_language} without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.";
