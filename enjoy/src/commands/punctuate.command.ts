import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";

export const punctuateCommand = async (
  text: string,
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
  ]).format({});

  return textCommand(prompt, options);
};

const SYSTEM_PROMPT = `Please add proper punctuation to the text I provide you. Return the corrected text only.`;
