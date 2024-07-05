import Markdown from "react-markdown";

export const MarkdownWrapper = ({ children }: { children: string }) => {
  return (
    <Markdown
      components={{
        a({ node, children, ...props }) {
          try {
            new URL(props.href ?? "");
            props.target = "_blank";
            props.rel = "noopener noreferrer";
          } catch (e) {}

          return <a {...props}>{children}</a>;
        },
      }}
    >
      {children}
    </Markdown>
  );
};
