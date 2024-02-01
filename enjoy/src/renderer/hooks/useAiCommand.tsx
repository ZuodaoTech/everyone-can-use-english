import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import {
  lookupCommand,
  extractStoryCommand,
  translateCommand,
  ipaCommand,
} from "@commands";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { md5 } from "js-md5";

export const useAiCommand = () => {
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const { currentEngine } = useContext(AISettingsProviderContext);

  const lookupWord = async (params: {
    word: string;
    context: string;
    sourceId?: string;
    sourceType?: string;
  }) => {
    const { word, context, sourceId, sourceType } = params;

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

  const translate = async (text: string): Promise<string> => {
    const hash = md5.create();
    hash.update(text);
    const cacheKey = `translate-${hash.hex()}`;
    const cached = await EnjoyApp.cacheObjects.get(cacheKey);
    if (cached) return cached;

    return translateCommand(text, {
      key: currentEngine.key,
      modelName: currentEngine.model,
      baseUrl: currentEngine.baseUrl,
    }).then((res) => {
      EnjoyApp.cacheObjects.set(cacheKey, res);
      return res;
    });
  };

  const pronounce = async (
    text: string
  ): Promise<
    {
      word?: string;
      ipa?: string;
    }[]
  > => {
    const hash = md5.create();
    hash.update(text);
    const cacheKey = `ipa-${hash.hex()}`;
    const cached = await EnjoyApp.cacheObjects.get(cacheKey);
    if (cached) return cached;

    return ipaCommand(text, {
      key: currentEngine.key,
      modelName: currentEngine.model,
      baseUrl: currentEngine.baseUrl,
    }).then((result) => {
      if (result?.words?.length > 0) {
        EnjoyApp.cacheObjects.set(cacheKey, result.words);
      }
      return result.words;
    });
  };

  return {
    lookupWord,
    extractStory,
    translate,
    pronounce,
  };
};
