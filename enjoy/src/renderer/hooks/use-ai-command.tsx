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
  punctuateCommand,
  summarizeTopicCommand,
} from "@commands";

export const useAiCommand = () => {
  const { EnjoyApp, webApi, nativeLanguage, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const { currentEngine } = useContext(AISettingsProviderContext);

  const lookupWord = async (params: {
    word: string;
    context: string;
    sourceId?: string;
    sourceType?: string;
    cacheKey?: string;
    force?: boolean;
  }) => {
    const { context, sourceId, sourceType, cacheKey, force = false } = params;
    let { word } = params;
    word = word.trim();
    if (!word) return;

    const lookup = await webApi.lookup({
      word,
      context,
      sourceId,
      sourceType,
      nativeLanguage,
    });

    if (lookup.meaning && !force) {
      return lookup;
    }

    const modelName =
      currentEngine.models.lookup || currentEngine.models.default;

    const res = await lookupCommand(
      {
        word,
        context,
        meaningOptions: lookup.meaningOptions,
        nativeLanguage,
        learningLanguage,
      },
      {
        key: currentEngine.key,
        modelName,
        baseUrl: currentEngine.baseUrl,
      }
    );

    webApi.updateLookup(lookup.id, {
      meaning: res,
      sourceId,
      sourceType,
    });

    const result = Object.assign(lookup, {
      meaning: res,
    });

    if (cacheKey) {
      EnjoyApp.cacheObjects.set(cacheKey, result);
    }

    return result;
  };

  const extractStory = async (story: StoryType) => {
    const res = await extractStoryCommand(story.content, learningLanguage, {
      key: currentEngine.key,
      modelName:
        currentEngine.models.extractStory || currentEngine.models.default,
      baseUrl: currentEngine.baseUrl,
    });
    const { words = [], idioms = [] } = res;

    return webApi.extractVocabularyFromStory(story.id, {
      words,
      idioms,
    });
  };

  const translate = async (
    text: string,
    cacheKey?: string
  ): Promise<string> => {
    return translateCommand(text, nativeLanguage, {
      key: currentEngine.key,
      modelName: currentEngine.models.translate || currentEngine.models.default,
      baseUrl: currentEngine.baseUrl,
    }).then((res) => {
      if (cacheKey) {
        EnjoyApp.cacheObjects.set(cacheKey, res);
      }
      return res;
    });
  };

  const analyzeText = async (text: string, cacheKey?: string) => {
    const res = await analyzeCommand(
      text,
      {
        learningLanguage,
        nativeLanguage,
      },
      {
        key: currentEngine.key,
        modelName: currentEngine.models.analyze || currentEngine.models.default,
        baseUrl: currentEngine.baseUrl,
      }
    );

    if (cacheKey) {
      EnjoyApp.cacheObjects.set(cacheKey, res);
    }
    return res;
  };

  const punctuateText = async (text: string) => {
    return punctuateCommand(text, {
      key: currentEngine.key,
      modelName: currentEngine.models.default,
      baseUrl: currentEngine.baseUrl,
    });
  };

  const summarizeTopic = async (text: string) => {
    return summarizeTopicCommand(text, learningLanguage, {
      key: currentEngine.key,
      modelName: currentEngine.models.default,
      baseUrl: currentEngine.baseUrl,
    });
  };

  return {
    lookupWord,
    extractStory,
    translate,
    analyzeText,
    punctuateText,
    summarizeTopic,
  };
};
