import Markdown from "react-markdown";

export const MarkdownWrapper = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  return (
    <Markdown
      className={className}
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
