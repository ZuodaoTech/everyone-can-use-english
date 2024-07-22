import { useContext, MouseEvent } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { throttle } from "lodash";

export const Vocabulary = ({
  word,
  context,
  children,
}: {
  word: string;
  context?: string;
  children?: React.ReactNode;
}) => {
  const { vocabularyConfig, EnjoyApp } = useContext(AppSettingsProviderContext);
  const handleMouseEnter = throttle((e) => {
    EnjoyApp.lookup(word, context, { x: e.clientX, y: e.clientY });
  }, 500);

  return vocabularyConfig.lookupOnMouseOver ? (
    <span
      className="cursor-pointer hover:bg-sky-700"
      onMouseEnter={handleMouseEnter}
    >
      <span>{word || children}</span>
    </span>
  ) : (
    <span>{word || children}</span>
  );
};
