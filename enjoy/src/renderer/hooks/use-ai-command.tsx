import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import {
  lookupCommand,
  extractStoryCommand,
  translateCommand,
  analyzeCommand,
} from "@commands";

export const useAiCommand = () => {
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const { currentEngine } = useContext(AISettingsProviderContext);

  const lookupWord = async (params: {
    word: string;
    context: string;
    sourceId?: string;
    sourceType?: string;
  }) => {
    const { context, sourceId, sourceType } = params;
    let { word } = params;
    word = word.trim();
    if (!word) return;

    const lookup = await webApi.lookup({
      word,
      context,
      sourceId,
      sourceType,
    });

    if (lookup.meaning) {
      return lookup;
    }

    const res = await lookupCommand(
      {
        word,
        context,
        meaningOptions: lookup.meaningOptions,
      },
      {
        key: currentEngine.key,
        modelName: currentEngine.model,
        baseUrl: currentEngine.baseUrl,
      }
    );

    if (res.context_translation?.trim()) {
      return webApi.updateLookup(lookup.id, {
        meaning: res,
        sourceId,
        sourceType,
      });
    }
  };

  const extractStory = async (story: StoryType) => {
    return extractStoryCommand(story.content, {
      key: currentEngine.key,
      modelName: currentEngine.model,
      baseUrl: currentEngine.baseUrl,
    }).then((res) => {
      const { words = [], idioms = [] } = res;

      return webApi.extractVocabularyFromStory(story.id, {
        words,
        idioms,
      });
    });
  };

  const translate = async (
    text: string,
    cacheKey?: string
  ): Promise<string> => {
    return translateCommand(text, {
      key: currentEngine.key,
      modelName: currentEngine.model,
      baseUrl: currentEngine.baseUrl,
    }).then((res) => {
      if (cacheKey) {
        EnjoyApp.cacheObjects.set(cacheKey, res);
      }
      return res;
    });
  };

  const analyzeText = async (text: string, cacheKey?: string) => {
    return analyzeCommand(text, {
      key: currentEngine.key,
      modelName: currentEngine.model,
      baseUrl: currentEngine.baseUrl,
    }).then((res) => {
      if (cacheKey) {
        EnjoyApp.cacheObjects.set(cacheKey, res);
      }
      return res;
    });
  };

  return {
    lookupWord,
    extractStory,
    translate,
    analyzeText,
  };
};
