import { Input, Button, ScrollArea, toast } from "@renderer/components/ui";
import {
  LoaderSpin,
  StoryViewer,
  StoryPreviewToolbar,
} from "@renderer/components";
import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { Readability } from "@mozilla/readability";
import { convert } from "html-to-text";
import { ChevronLeftIcon, BookOpenTextIcon } from "lucide-react";
import { t } from "i18next";
import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.plugin(paragraphs);

export default () => {
  const navigate = useNavigate();
  const { uri } = useParams<{ uri: string }>();
  const containerRef = useRef<HTMLDivElement>();
  const [url, setUrl] = useState(decodeURIComponent(uri));
  const [error, setError] = useState<string>();
  const [story, setStory] = useState<Partial<CreateStoryParamsType>>({
    url,
  });
  const [loading, setLoading] = useState(true);
  const [readable, setReadable] = useState(true);
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const [marked, setMarked] = useState<boolean>(false);
  const [doc, setDoc] = useState<any>(null);

  const loadURL = () => {
    if (!containerRef?.current) return;
    if (!url) return;

    setError(null);
    setLoading(true);
    setStory({ url });

    const rect = containerRef.current.getBoundingClientRect();
    EnjoyApp.view.load(url, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  };

  const createStory = async () => {
    if (!story) return;

    webApi
      .createStory({
        url: story.metadata?.url || story.url,
        ...story,
      } as CreateStoryParamsType)
      .then((story) => {
        navigate(`/stories/${story.id}`);
      });
  };

  const onViewState = async (event: {
    state: string;
    error?: string;
    url?: string;
    html?: string;
  }) => {
    const { state, error, html } = event;

    if (state == "did-fail-load") {
      setLoading(false);
      if (error) {
        toast.error(error);
        setError(error);
      }

      return;
    }
    if (state !== "did-finish-load") return;
    if (!html) return;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      setLoading(false);
      setReadable(false);
      return;
    }

    const content = convert(article.content, {
      wordwrap: false,
      selectors: [
        {
          selector: "a",
          options: {
            hideLinkHrefIfSameAsText: true,
            ignoreHref: true,
          },
        },
        {
          selector: "img",
          options: {
            linkBrackets: ["![](", ")"],
          },
        },
      ],
    });

    let favicon =
      doc.querySelector('link[rel="icon"]')?.getAttribute("href") || "";
    if (favicon.startsWith("/")) {
      favicon = new URL(favicon, new URL(url).origin).href;
    }

    const ogUrl =
      doc.querySelector('meta[property="og:url"]')?.getAttribute("content") ||
      "";

    const metadata = {
      url: ogUrl || url,
      title: article.title,
      description:
        doc
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") || article.excerpt,
      byline: article.byline,
      image:
        doc
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content") || "",
      favicon,
    };

    doc.querySelectorAll("script, style, iframe").forEach((tag) => {
      tag.remove();
    });

    setStory({
      title: article.title,
      content,
      metadata,
      ...story,
    });

    const _doc = nlp(content);
    _doc.cache();
    setDoc(_doc);

    setLoading(false);
  };

  useEffect(() => {
    loadURL();
  }, [url, containerRef]);

  useEffect(() => {
    EnjoyApp.view.onViewState((_event, state) => onViewState(state));

    return () => {
      EnjoyApp.view.removeViewStateListeners();
      EnjoyApp.view.remove();
    };
  }, []);

  useEffect(() => {
    if (readable) {
      EnjoyApp.view.hide();
    } else if (!loading) {
      const rect = containerRef.current.getBoundingClientRect();
      EnjoyApp.view.show({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [readable, loading]);

  return (
    <div className="h-screen w-full flex flex-col bg-muted">
      {(loading || !readable) && (
        <div className="h-12 flex items-center space-x-2 px-4 border-b shadow">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Button>
          <Input
            disabled
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-full h-8 bg-muted focus-visible:ring-0 px-4"
          />
          <Button
            variant={readable ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full p-1"
            onClick={() => setReadable(!readable)}
          >
            <BookOpenTextIcon className="w-5 h-5" />
          </Button>
        </div>
      )}

      <ScrollArea ref={containerRef} className="flex-1 relative">
        {loading ? (
          <div className="h-96 w-full">
            <LoaderSpin />
          </div>
        ) : error ? (
          <div className="w-full min-h-[50vh] flex items-center justify-center">
            <div className="m-auto">
              <div className="mb-6">{error}</div>
              <div className="flex justify-center">
                <Button onClick={loadURL}>{t("retry")}</Button>
              </div>
            </div>
          </div>
        ) : (
          story?.content &&
          readable && (
            <>
              <StoryPreviewToolbar
                marked={marked}
                toggleMarked={() => setMarked(!marked)}
                onCreateStory={createStory}
                readable={readable}
                onToggleReadable={() => setReadable(!readable)}
              />

              <StoryViewer
                story={story}
                meanings={meanings}
                setMeanings={setMeanings}
                marked={marked}
                doc={doc}
              />
            </>
          )
        )}
      </ScrollArea>
    </div>
  );
};
