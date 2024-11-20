import { t } from "i18next";
import { ScrollArea, toast } from "@renderer/components/ui";
import {
  LoaderSpin,
  PagePlaceholder,
  StoryToolbar,
  StoryViewer,
  StoryVocabularySheet,
} from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { useAiCommand } from "@renderer/hooks";
import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.plugin(paragraphs);

export default () => {
  const { id } = useParams<{ id: string }>();
  const { webApi } = useContext(AppSettingsProviderContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [story, setStory] = useState<StoryType>();
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const [pendingLookups, setPendingLookups] = useState<Partial<LookupType>[]>(
    []
  );
  const [scanning, setScanning] = useState<boolean>(true);
  const [marked, setMarked] = useState<boolean>(true);
  const [doc, setDoc] = useState<any>(null);
  const [vocabularyVisible, setVocabularyVisible] = useState<boolean>(false);
  const [lookingUpInBatch, setLookupInBatch] = useState<boolean>(false);
  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const { lookupWord, extractStory } = useAiCommand();

  const fetchStory = async () => {
    webApi
      .story(id)
      .then((story) => {
        setStory(story);
        setVocabularyVisible(!story.extracted);
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
        setPendingLookups(response.pendingLookups || []);
      })
      .finally(() => {
        setScanning(false);
      });
  };

  const extractVocabulary = async () => {
    if (!story) return;

    const { words = [], idioms = [] } = story?.extraction || {};
    if (story?.extracted && (words.length > 0 || idioms.length > 0)) return;

    toast.promise(
      extractStory(story)
        .then(() => {
          fetchStory();
        })
        .finally(() => {
          setScanning(false);
        }),
      {
        loading: t("extracting"),
        success: t("extractedSuccessfully"),
        error: (err) => t("extractionFailed", { error: err.message }),
        position: "bottom-right",
      }
    );
  };

  const buildVocabulary = () => {
    if (!story?.extraction) return;
    if (meanings.length > 0 || pendingLookups.length > 0) return;
    if (!doc) return;
    if (scanning) return;

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

    const pendings = lookups
      .filter(
        (v) =>
          meanings.findIndex(
            (m) => m.word.toLowerCase() === v.word.toLowerCase()
          ) < 0
      )
      .filter(
        (v) =>
          pendingLookups.findIndex(
            (l) => l.word.toLowerCase() === v.word.toLowerCase()
          ) < 0
      );

    if (pendings.length === 0) return;

    webApi.lookupInBatch(pendings).then(() => {
      fetchMeanings();
    });
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

  const processLookup = async (pendingLookup: Partial<LookupType>) => {
    if (lookingUp) return;

    setLookingUp(true);
    toast.promise(
      lookupWord({
        word: pendingLookup.word,
        context: pendingLookup.context,
        sourceId: story.id,
        sourceType: "Story",
      })
        .then(() => {
          fetchMeanings();
        })
        .finally(() => {
          setLookingUp(false);
        }),
      {
        loading: t("lookingUp"),
        success: t("lookedUpSuccessfully"),
        error: (err) => t("lookupFailed", { error: err.message }),
        position: "bottom-right",
      }
    );
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
  }, [pendingLookups, meanings, story?.extraction]);

  useEffect(() => {
    if (!lookingUpInBatch) return;
    if (pendingLookups.length === 0) return;

    processLookup(pendingLookups[0]);
  }, [pendingLookups, lookingUpInBatch]);

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
      <ScrollArea className="h-content w-full bg-muted">
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
          vocabularyVisible={vocabularyVisible}
          setVocabularyVisible={setVocabularyVisible}
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
      <StoryVocabularySheet
        pendingLookups={pendingLookups}
        extracted={story.extracted}
        meanings={meanings}
        vocabularyVisible={vocabularyVisible}
        setVocabularyVisible={setVocabularyVisible}
        lookingUpInBatch={lookingUpInBatch}
        setLookupInBatch={setLookupInBatch}
        processLookup={processLookup}
        lookingUp={lookingUp}
      />
    </>
  );
};
