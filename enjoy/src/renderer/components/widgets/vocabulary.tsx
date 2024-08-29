import React, { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export const Vocabulary = ({
  word,
  context,
  children,
}: {
  word: string;
  context?: string;
  children?: React.ReactNode;
}) => {
  let timeout: ReturnType<typeof setTimeout>;

  const { vocabularyConfig, EnjoyApp } = useContext(AppSettingsProviderContext);

  const handleMouseEnter = (e: React.MouseEvent) => {
    timeout = setTimeout(() => {
      EnjoyApp.lookup(word, context, { x: e.clientX, y: e.clientY });
    }, 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeout);
  };

  return vocabularyConfig.lookupOnMouseOver ? (
    <span
      className="cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{word || children}</span>
    </span>
  ) : (
    <span>{word || children}</span>
  );
};
