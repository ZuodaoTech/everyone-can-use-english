import Markdown from "react-markdown";
import { visitParents } from "unist-util-visit-parents";
import { Sentence } from "@renderer/components";
import { cn } from "@renderer/lib/utils";

function rehypeWrapText() {
  return function wrapTextTransform(tree: any) {
    visitParents(tree, "text", (node, ancestors) => {
      const parent = ancestors.at(-1);

      if (parent.tagName !== "vocabulary") {
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
  ...props
}: {
  children: string;
  className?: string;
}) => {
  return (
    <Markdown
      className={cn("prose dark:prose-invert", className)}
      rehypePlugins={[rehypeWrapText]}
      components={{
        a({ node, children, ...props }) {
          try {
            new URL(props.href ?? "");
            props.target = "_blank";
            props.rel = "noopener noreferrer";
          } catch (e) {}

          return <a {...props}>{children}</a>;
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
