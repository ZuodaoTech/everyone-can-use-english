import { useContext, useState, memo } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export const Vocabulary = memo(
  ({
    word,
    context,
    children,
  }: {
    word: string;
    context?: string;
    children?: React.ReactNode;
  }) => {
    let [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();
    const { vocabularyConfig, EnjoyApp } = useContext(
      AppSettingsProviderContext
    );

    const handleLookup = (e: any) => {
      if (!context) {
        context = e.target?.parentElement
          .closest(".sentence, h2, p, div")
          ?.textContent?.trim();
      }

      const { x, bottom: y } = e.target.getBoundingClientRect();
      const _word = word.replace(/[^\w\s]|_/g, "");

      EnjoyApp.lookup(_word, context, { x, y });
    };

    const handleMouseEnter = (e: any) => {
      let _timer = setTimeout(() => {
        if (!context) {
          context = e.target?.parentElement
            .closest(".sentence, h2, p, div")
            ?.textContent?.trim();
        }

        const { x, bottom: y } = e.target.getBoundingClientRect();
        const _word = word.replace(/[^\w\s]|_/g, "");

        EnjoyApp.lookup(_word, context, { x, y });
      }, 800);

      setTimer(_timer);
    };

    const handleMouseLeave = () => {
      clearTimeout(timer);
    };

    return vocabularyConfig.lookupOnMouseOver ? (
      <span
        className="cursor-pointer hover:bg-active-word"
        onClick={handleLookup}
      >
        {word || children}
      </span>
    ) : (
      <span>{word || children}</span>
    );
  }
);

Vocabulary.displayName = "Vocabulary";
