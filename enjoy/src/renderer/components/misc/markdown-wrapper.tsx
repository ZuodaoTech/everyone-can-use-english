import Markdown, { defaultUrlTransform } from "react-markdown";
import { visitParents } from "unist-util-visit-parents";
import { Sentence } from "@renderer/components";
import { cn } from "@renderer/lib/utils";
import remarkGfm from "remark-gfm";

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

export const MarkdownWrapper = ({
  children,
  className,
  onLinkClick,
  ...props
}: {
  children: string;
  className?: string;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) => {
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
      components={{
        a({ node, children, ...props }) {
          try {
            new URL(props.href ?? "");
            props.target = "_blank";
            props.rel = "noopener noreferrer";
          } catch (e) {}

          return (
            <a {...props} onClick={onLinkClick}>
              {children}
            </a>
          );
        },
        vocabulary({ node, children, ...props }) {
          return <Sentence sentence={props.text} />;
        },
      }}
      {...props}
    >
      {children}
    </Markdown>
  );
};
