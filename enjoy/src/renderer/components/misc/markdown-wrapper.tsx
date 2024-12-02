import Markdown, { defaultUrlTransform } from "react-markdown";
import { visitParents } from "unist-util-visit-parents";
import { Sentence } from "@renderer/components";
import { cn } from "@renderer/lib/utils";
import remarkGfm from "remark-gfm";
import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  memo,
  useContext,
} from "react";
import {
  LanguagesIcon,
  LoaderIcon,
  PlayIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button, toast } from "@renderer/components/ui";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { md5 } from "js-md5";
import { AppSettingsProviderContext } from "@/renderer/context";
import { useAiCommand } from "@/renderer/hooks";

function rehypeWrapText() {
  return function wrapTextTransform(tree: any) {
    visitParents(tree, "text", (node, ancestors) => {
      const parent = ancestors.at(-1);

      if (parent.tagName !== "vocabulary" && parent.tagName !== "a") {
        node.type = "element";
        node.tagName = "vocabulary";
        node.properties = { text: node.value };
        node.children = [{ type: "text", value: node.value }];
      }
    });
  };
}

// Memoize the Segment component
const Segment = memo(
  ({
    tag: Tag,
    index,
    children,
    onSegmentVisible,
    onSpeech,
    autoTranslate,
    translatable,
    section,
    ...props
  }: {
    tag: "h1" | "h2" | "h3" | "h4" | "h5" | "p";
    index: number;
    children: any;
    onSegmentVisible?: (id: string) => void;
    onSpeech?: (id: string) => void;
    autoTranslate?: boolean;
    translatable?: boolean;
    section?: number;
  }) => {
    const { EnjoyApp } = useContext(AppSettingsProviderContext);
    const { translate } = useAiCommand();
    const [translating, setTranslating] = useState(false);
    const [translation, setTranslation] = useState<string>("");

    const [ref, entry] = useIntersectionObserver({
      threshold: 0,
      root: null,
      rootMargin: "0px",
    });

    const toggleTranslation = () => {
      if (translation) {
        setTranslation("");
      } else {
        handleTranslate();
      }
    };

    const handleTranslate = async (force = false) => {
      if (translating) return;

      const content = entry.target
        ?.querySelector(".segment-content")
        ?.textContent?.trim();
      if (!content) return;

      const md5Hash = md5(content);

      const cacheKey = `translate-${md5Hash}`;
      const cached = await EnjoyApp.cacheObjects.get(cacheKey);
      if (cached && !force) {
        setTranslation(cached);
      } else {
        setTranslating(true);
        setTranslation("");
        translate(content, cacheKey)
          .then((result) => {
            setTranslation(result);
          })
          .catch((error) => {
            toast.error(error.message);
          })
          .finally(() => {
            setTranslating(false);
          });
      }
    };

    const content = useMemo(() => {
      if (!entry?.target) return "";
      return entry.target?.textContent?.trim();
    }, [entry]);

    const id = `segment-${index}`;

    useEffect(() => {
      if (!onSegmentVisible) return;
      if (entry?.isIntersecting) {
        onSegmentVisible(`segment-${index}`);
        if (autoTranslate) {
          handleTranslate();
        }
      }
    }, [entry?.isIntersecting, autoTranslate]);

    return (
      <>
        <Tag
          id={`segment-${index}`}
          ref={ref}
          data-index={index}
          data-section={section}
          className="segment"
        >
          <span className="flex items-center gap-2 opacity-50 hover:opacity-100">
            {content && (onSpeech || translatable) && (
              <span className="text-xs text-muted-foreground">
                #{index + 1}
              </span>
            )}
            {onSpeech && content && (
              <Button
                onClick={() => {
                  onSpeech(id);
                }}
                variant="ghost"
                size="icon"
                className="w-4 h-4"
              >
                <PlayIcon className="w-3 h-3" />
              </Button>
            )}
            {translatable && content && (
              <Button
                onClick={toggleTranslation}
                variant="ghost"
                size="icon"
                className="w-4 h-4"
              >
                {translating ? (
                  <LoaderIcon className="w-3 h-3 animate-spin" />
                ) : (
                  <LanguagesIcon className="w-3 h-3" />
                )}
              </Button>
            )}
          </span>
          <span className="segment-content">{children}</span>
        </Tag>
        {translation && (
          <Tag id={`translation-${index}`} className="translation">
            {translation}
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 opacity-50 hover:opacity-100"
              onClick={() => handleTranslate(true)}
            >
              <RefreshCwIcon className="w-3 h-3" />
            </Button>
          </Tag>
        )}
      </>
    );
  }
);

// Wrap MarkdownWrapper with React.memo and memoize callbacks
export const MarkdownWrapper = memo(
  ({
    children,
    className,
    onLinkClick,
    onSpeech,
    onSegmentVisible,
    translatable = false,
    autoTranslate,
    section,
    ...props
  }: {
    children: string;
    className?: string;
    onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    onSpeech?: (id: string) => void;
    onSegmentVisible?: (id: string) => void;
    translatable?: boolean;
    autoTranslate?: boolean;
    section?: number;
  }) => {
    // Memoize component callbacks
    const handleLinkClick = useCallback(onLinkClick, [onLinkClick]);

    const components = useMemo(() => {
      let segmentIndex = 0;
      const HEADER_COMPONENTS = ["h1", "h2", "h3", "h4", "h5", "p"] as const;

      const headerComponents = Object.fromEntries(
        HEADER_COMPONENTS.map((tag) => [
          tag,
          ({ node, children, ...props }: any) => (
            <Segment
              tag={tag}
              index={segmentIndex++}
              onSegmentVisible={onSegmentVisible}
              onSpeech={onSpeech}
              autoTranslate={autoTranslate}
              translatable={translatable}
              section={section}
              {...props}
            >
              {children}
            </Segment>
          ),
        ])
      );

      return {
        a({ node, children, ...props }: any) {
          try {
            new URL(props.href ?? "");
            props.target = "_blank";
            props.rel = "noopener noreferrer";
          } catch (e) {}

          return (
            <a {...props} onClick={handleLinkClick}>
              {children}
            </a>
          );
        },
        vocabulary({ node, children, ...props }: any) {
          return <Sentence sentence={props.text} />;
        },
        ...headerComponents,
      };
    }, [handleLinkClick, onSegmentVisible, onSpeech, autoTranslate, section]);

    return (
      <Markdown
        className={cn("prose dark:prose-invert", className)}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeWrapText]}
        urlTransform={(url) => {
          if (url.startsWith("blob:") || url.startsWith("data:")) {
            return url;
          }
          return defaultUrlTransform(url);
        }}
        components={components}
        {...props}
      >
        {children}
      </Markdown>
    );
  }
);

MarkdownWrapper.displayName = "MarkdownWrapper";
