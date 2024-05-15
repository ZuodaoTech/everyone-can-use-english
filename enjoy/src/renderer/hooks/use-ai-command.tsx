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

    const modelName =
      currentEngine.models.lookup || currentEngine.models.default;

    const res = await lookupCommand(
      {
        word,
        context,
        meaningOptions: lookup.meaningOptions,
      },
      {
        key: currentEngine.key,
        modelName,
        baseUrl: currentEngine.baseUrl,
      }
    );

    // Accept result from gpt-3/4 models
    if (modelName.match(/^gpt-(3|4)\S*/i) && res.context_translation?.trim()) {
      return webApi.updateLookup(lookup.id, {
        meaning: res,
        sourceId,
        sourceType,
      });
    }
  };

  const extractStory = async (story: StoryType) => {
    console.log(story);
    const res = await extractStoryCommand(story.content, {
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
    return translateCommand(text, {
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
    const res = await analyzeCommand(text, {
      key: currentEngine.key,
      modelName: currentEngine.models.analyze || currentEngine.models.default,
      baseUrl: currentEngine.baseUrl,
    });

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
    return summarizeTopicCommand(text, {
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
