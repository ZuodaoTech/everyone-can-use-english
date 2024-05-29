import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";
import { LANGUAGES } from "@/constants";

export const translateCommand = async (
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
    ["human", TRANSLATION_PROMPT],
  ]).format({
    native_language: LANGUAGES.find((l) => l.code === nativeLanguage).name,
    text,
  });

  return textCommand(prompt, options);
};

const SYSTEM_PROMPT =
  "You are a professional, authentic translation engine, only returns translations.";
const TRANSLATION_PROMPT = `Translate the text to {native_language} Language, please do not explain my original text.:

{text}
`;
