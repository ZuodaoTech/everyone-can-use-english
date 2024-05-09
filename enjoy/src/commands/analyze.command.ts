import { ChatPromptTemplate } from "@langchain/core/prompts";
import { textCommand } from "./text.command";

export const analyzeCommand = async (
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

const SYSTEM_PROMPT = `你是我的英语教练，我将提供英语文本，你将帮助我分析文本的句子结构、语法和词汇/短语，并对文本进行详细解释。请用中文回答，并按以下格式返回结果：

  ### 句子结构
  (解释句子的每个元素)

  ### 语法
  (解释句子的语法)

  ### 词汇/短语
  (解释使用的关键词汇和短语)`;
