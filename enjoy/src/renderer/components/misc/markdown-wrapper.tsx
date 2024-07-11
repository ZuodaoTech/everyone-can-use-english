import Markdown from "react-markdown";

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
      {...props}
    >
      {children}
    </Markdown>
  );
};
