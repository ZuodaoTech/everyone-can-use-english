import { t } from "i18next";
import { ScrollArea, useToast } from "@renderer/components/ui";
import {
  LoaderSpin,
  PagePlaceholder,
  StoryToolbar,
  StoryViewer,
} from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.plugin(paragraphs);

let timeout: NodeJS.Timeout = null;
export default () => {
  const { id } = useParams<{ id: string }>();
  const { webApi } = useContext(AppSettingsProviderContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [story, setStory] = useState<StoryType>();
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const [pendingLookups, setPendingLookups] = useState<LookupType[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [marked, setMarked] = useState<boolean>(true);
  const [doc, setDoc] = useState<any>(null);
  const { toast } = useToast();

  const fetchStory = async () => {
    webApi
      .story(id)
      .then((story) => {
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
        setPendingLookups(response.pendingLookups);

        if (response.pendingLookups.length > 0) {
          if (timeout) clearTimeout(timeout);

          timeout = setTimeout(() => {
            fetchMeanings();
          }, 3000);
        }
      })
      .finally(() => {
        setScanning(false);
      });
  };

  const lookupVocabulary = () => {
    if (story?.extracted) return;
    if (!doc) return;

    const vocabulary: any[] = [];

    story.vocabulary.forEach((word) => {
      const m = doc.lookup(word);

      const sentences = m.sentences().json();
      sentences.forEach((sentence: any) => {
        const context = sentence.text.trim();
        if (!context) {
          console.warn(`No context for ${word}`);
          return;
        }

        vocabulary.push({
          word,
          context,
          sourceId: story.id,
          sourceType: "Story",
        });
      });
    });

    webApi.lookupInBatch(vocabulary).then((response) => {
      const { errors } = response;
      if (errors.length > 0) {
        console.warn(errors);
        return;
      }

      webApi.extractVocabularyFromStory(id).then(() => {
        fetchStory();
        if (pendingLookups.length > 0) return;

        fetchMeanings();
      });
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
        toast({
          description: t("sharedStory"),
        });
      })
      .catch((error) => {
        toast({
          title: t("shareFailed"),
          description: error.message,
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    fetchStory();
    fetchMeanings();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [id]);

  useEffect(() => {
    lookupVocabulary();
  }, [story]);

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
          pendingLookups={pendingLookups}
          handleShare={handleShare}
        />

        <StoryViewer
          story={story}
          marked={marked}
          meanings={meanings}
          pendingLookups={pendingLookups}
          setMeanings={setMeanings}
          doc={doc}
        />
      </ScrollArea>
    </>
  );
};
