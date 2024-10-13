import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";
import { LANGUAGES } from "@/constants";

export const refineCommand = async (
  text: string,
  params: {
    learningLanguage: string;
    nativeLanguage: string;
    context: string;
  },
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<string> => {
  if (!text) throw new Error("Text is required");

  const { learningLanguage, nativeLanguage, context = "None" } = params;
  const formattedContext = context.replace(/\{/g, "{{").replace(/\}/g, "}}");

  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", text],
  ]).format({
    learning_language: LANGUAGES.find((l) => l.code === learningLanguage).name,
    native_language: LANGUAGES.find((l) => l.code === nativeLanguage).name,
    context: formattedContext,
  });

  return textCommand(prompt, options);
};

const SYSTEM_PROMPT = `I speak {native_language}. You're my {learning_language} coach. I'll give you my expression in {learning_language}. And I may also provide some context about my expression. 

Please try to understand my true meaning and provide several refined expressions in the native way. And explain them in {native_language}.

[Context]
{context}`;
