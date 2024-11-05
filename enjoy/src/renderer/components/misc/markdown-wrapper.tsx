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
  RefreshCwIcon,
  SpeechIcon,
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

// Memoize the Paragraph component
const Paragraph = memo(
  ({
    index,
    children,
    onParagraphVisible,
    onSpeech,
    autoTranslate,
    translatable,
    ...props
  }: {
    index: number;
    children: any;
    onParagraphVisible?: (id: string) => void;
    onSpeech?: (id: string) => void;
    autoTranslate?: boolean;
    translatable?: boolean;
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

      const content = entry.target.textContent?.trim();
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
      return entry.target.textContent?.trim();
    }, [entry?.target]);

    const id = `paragraph-${index}`;

    useEffect(() => {
      if (!onParagraphVisible) return;
      if (entry?.isIntersecting) {
        onParagraphVisible(`paragraph-${index}`);
        if (autoTranslate) {
          handleTranslate();
        }
      }
    }, [entry?.isIntersecting, autoTranslate]);

    return (
      <>
        <p
          ref={ref}
          id={id}
          className="paragraph"
          data-index={index}
          {...props}
        >
          <span className="flex items-center gap-2 opacity-50 hover:opacity-100">
            {onSpeech && content && (
              <Button
                onClick={() => {
                  onSpeech(id);
                }}
                variant="ghost"
                size="icon"
                className="w-4 h-4"
              >
                <SpeechIcon className="w-3 h-3" />
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
          <span>{children}</span>
        </p>
        {translation && (
          <p id={`translation-${index}`}>
            {translation}
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 opacity-50 hover:opacity-100"
              onClick={() => handleTranslate(true)}
            >
              <RefreshCwIcon className="w-3 h-3" />
            </Button>
          </p>
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
    onParagraphVisible,
    translatable = false,
    autoTranslate,
    ...props
  }: {
    children: string;
    className?: string;
    onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    onSpeech?: (id: string) => void;
    onParagraphVisible?: (id: string) => void;
    translatable?: boolean;
    autoTranslate?: boolean;
  }) => {
    // Memoize component callbacks
    const handleLinkClick = useCallback(onLinkClick, [onLinkClick]);

    const components = useMemo(() => {
      let paragraphIndex = 0;

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
        p({ node, children, ...props }: any) {
          return (
            <Paragraph
              index={paragraphIndex++}
              onParagraphVisible={onParagraphVisible}
              onSpeech={onSpeech}
              autoTranslate={autoTranslate}
              translatable={translatable}
              {...props}
            >
              {children}
            </Paragraph>
          );
        },
      };
    }, [handleLinkClick, onParagraphVisible, onSpeech, autoTranslate]);

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
