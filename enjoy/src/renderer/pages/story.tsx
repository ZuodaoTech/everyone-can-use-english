import { t } from "i18next";
import { ScrollArea, toast } from "@renderer/components/ui";
import {
  LoaderSpin,
  PagePlaceholder,
  StoryToolbar,
  StoryViewer,
} from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { extractStoryCommand } from "@/commands";
import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.plugin(paragraphs);

export default () => {
  const { id } = useParams<{ id: string }>();
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [story, setStory] = useState<StoryType>();
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const [pendingLookups, setPendingLookups] = useState<Partial<LookupType>[]>(
    []
  );
  const [scanning, setScanning] = useState<boolean>(false);
  const [marked, setMarked] = useState<boolean>(true);
  const [doc, setDoc] = useState<any>(null);

  const fetchStory = async () => {
    webApi
      .story(id)
      .then((story) => {
        console.log(story);
        setStory(story);
        const doc = nlp(story.content);
        doc.cache();
        setDoc(doc);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchMeanings = async () => {
    setScanning(true);
    webApi
      .storyMeanings(id, { items: 500 })
      .then((response) => {
        if (!response) return;

        setMeanings(response.meanings);
      })
      .finally(() => {
        setScanning(false);
      });
  };

  const extractVocabulary = async () => {
    if (!story) return;

    let { words, idioms } = story?.extraction || {};
    if (story?.extracted && (words.length > 0 || idioms.length > 0)) return;

    toast.promise(
      async () => {
        if (words.length === 0 && idioms.length === 0) {
          const openAIConfig = await EnjoyApp.settings.getLlm("openai");
          if (!openAIConfig?.key) {
            toast.error(t("openaiApiKeyRequired"));
            return;
          }

          try {
            const res = await extractStoryCommand(story.content, {
              key: openAIConfig.key,
            });

            words = res.words || [];
            idioms = res.idioms || [];
          } catch (error) {
            toast.error(t("extractionFailed"), {
              description: error.message,
            });
            return;
          }
        }

        webApi
          .extractVocabularyFromStory(id, {
            words,
            idioms,
          })
          .then(() => {
            fetchStory();
          })
          .finally(() => {
            setScanning(false);
          });
      },
      {
        loading: t("extracting"),
        success: t("extracted"),
        error: (err) => t("extractionFailed", { error: err.message }),
        position: "bottom-right",
      }
    );
  };

  const buildVocabulary = () => {
    if (!doc) return;
    if (!story?.extraction) return;

    const { words = [], idioms = [] } = story.extraction || {};

    const lookups: any[] = [];

    [...words, ...idioms].forEach((word) => {
      const m = doc.lookup(word);

      const sentences = m.sentences().json();
      sentences.forEach((sentence: any) => {
        const context = sentence.text.trim();
        if (!context) {
          console.warn(`No context for ${word}`);
          return;
        }

        lookups.push({
          word,
          context,
          sourceId: story.id,
          sourceType: "Story",
        });
      });
    });

    setPendingLookups(
      lookups.filter((v) => meanings.findIndex((m) => m.word === v.word) < 0)
    );
  };

  const toggleStarred = () => {
    if (!story) return;

    if (story.starred) {
      webApi.unstarStory(id).then((result) => {
        setStory({ ...story, starred: result.starred });
      });
    } else {
      webApi.starStory(id).then((result) => {
        setStory({ ...story, starred: result.starred });
      });
    }
  };

  const handleShare = async () => {
    webApi
      .createPost({ targetId: story.id, targetType: "Story" })
      .then(() => {
        toast.success(t("sharedStory"));
      })
      .catch((error) => {
        toast.error(t("shareFailed"), {
          description: error.message,
        });
      });
  };

  useEffect(() => {
    fetchStory();
    fetchMeanings();
  }, [id]);

  useEffect(() => {
    extractVocabulary();
  }, [story?.extracted]);

  useEffect(() => {
    buildVocabulary();
  }, [meanings, story?.extraction]);

  if (loading) {
    return (
      <div className="h-[100vh] w-full p-4">
        <LoaderSpin />
      </div>
    );
  }

  if (!story) {
    return (
      <PagePlaceholder
        placeholder={t("notFound")}
        extra={`id=${id}`}
        showBackButton
      />
    );
  }

  return (
    <>
      <ScrollArea className="h-screen w-full bg-muted">
        <StoryToolbar
          marked={marked}
          toggleMarked={() => setMarked(!marked)}
          meanings={meanings}
          scanning={scanning}
          onScan={fetchMeanings}
          extracted={story.extracted}
          starred={story.starred}
          toggleStarred={toggleStarred}
          handleShare={handleShare}
        />

        <StoryViewer
          story={story}
          marked={marked}
          pendingLookups={pendingLookups}
          meanings={meanings}
          setMeanings={setMeanings}
          doc={doc}
        />
      </ScrollArea>
    </>
  );
};
