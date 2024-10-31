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
  useRef,
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
import { v4 as uuidv4 } from "uuid";
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
    ...props
  }: {
    index: number;
    children: any;
    onParagraphVisible?: (id: string) => void;
    onSpeech?: (id: string) => void;
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

    const id = useMemo(() => uuidv4(), [children]);
    // Get content from children

    const handleTranslate = async (force = false) => {
      if (translating) return;

      const content = entry.target.textContent?.trim();
      if (!content) return;

      const md5Hash = md5(content);

      const cacheKey = `translate-${md5Hash}`;
      const cached = await EnjoyApp.cacheObjects.get(cacheKey);
      if (cached && !force) {
        if (translation) {
          setTranslation("");
        } else {
          setTranslation(cached);
        }
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

    useEffect(() => {
      if (!onParagraphVisible) return;
      if (entry?.isIntersecting) {
        onParagraphVisible(`paragraph-${id}`);
      }
    }, [entry?.isIntersecting]);

    return (
      <>
        <p
          ref={ref}
          id={`paragraph-${id}`}
          className="paragraph"
          data-index={index}
          {...props}
        >
          <span className="flex items-center gap-2 opacity-50 hover:opacity-100">
            {onSpeech && (
              <Button
                onClick={() => onSpeech(id)}
                variant="ghost"
                size="icon"
                className="w-4 h-4"
              >
                <SpeechIcon className="w-3 h-3" />
              </Button>
            )}
            <Button
              onClick={() => handleTranslate()}
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
          </span>
          {children}
        </p>
        {translation && (
          <p id={`translation-${id}`}>
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
    ...props
  }: {
    children: string;
    className?: string;
    onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    onSpeech?: (id: string) => void;
    onParagraphVisible?: (id: string) => void;
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
              {...props}
            >
              {children}
            </Paragraph>
          );
        },
      };
    }, [handleLinkClick, onParagraphVisible, onSpeech]);

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
