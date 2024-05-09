import { useEffect, useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@renderer/components/ui";
import debounce from "lodash/debounce";

export const LookupWidget = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [selected, setSelected] = useState<{
    word: string;
    context?: string;
    position?: {
      top: number;
      left: number;
    };
  }>();

  const handleSelectionChanged = debounce(
    (position: { top: number; left: number }) => {
      const selection = document.getSelection();
      if (!selection?.anchorNode?.parentElement) return;

      const word = selection
        .toString()
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]+$/, "");
      if (!word) return;

      const context = selection.anchorNode.parentElement
        .closest("span.sentence, h2, p, span, div")
        ?.textContent?.trim();

      console.log("handleSelectionChanged", word, context, position);

      setSelected({ word, context, position });
    },
    100
  );

  useEffect(() => {
    EnjoyApp.onLookup((_event, selection, coodinate) => {
      handleSelectionChanged({ top: coodinate.y, left: coodinate.x });
    });

    return () => EnjoyApp.offLookup();
  }, []);

  return (
    <Popover
      open={Boolean(selected?.word)}
      onOpenChange={(value) => {
        if (!value) setSelected(null);
      }}
    >
      <PopoverAnchor
        className="absolute w-0 h-0"
        style={{
          top: selected?.position?.top,
          left: selected?.position?.left,
        }}
      ></PopoverAnchor>
      <PopoverContent
        className="w-full max-w-md p-0 z-50"
        updatePositionStrategy="always"
      >
        {selected?.word && <div className="p-4 border w-52 h-96"></div>}
      </PopoverContent>
    </Popover>
  );
};
