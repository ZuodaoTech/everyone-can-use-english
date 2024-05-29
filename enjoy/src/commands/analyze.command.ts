import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";
import { LANGUAGES } from "@/constants";

export const analyzeCommand = async (
  text: string,
  params: {
    learningLanguage: string;
    nativeLanguage: string;
  },
  options: {
    key: string;
    modelName?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<string> => {
  if (!text) throw new Error("Text is required");

  const { learningLanguage, nativeLanguage } = params;
  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", text],
  ]).format({
    learning_language: LANGUAGES.find((l) => l.code === learningLanguage).name,
    native_language: LANGUAGES.find((l) => l.code === nativeLanguage).name,
  });

  return textCommand(prompt, options);
};

const SYSTEM_PROMPT = `I speak {native_language}. You're my {learning_language} coach, I'll provide {learning_language} text, you'll help me analyze the sentence structure, grammar, and vocabulary/phrases, and provide a detailed explanation of the text. Please return the results in the following format(but in {native_language}):

### Sentence Structure
(Explain each element of the sentence)

### Grammar
(Explain the grammar of the sentence)

### Vocabulary/Phrases
(Explain the key vocabulary and phrases used)`;
