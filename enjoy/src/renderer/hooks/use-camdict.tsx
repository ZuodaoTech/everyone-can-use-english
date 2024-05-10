import { useEffect, useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export const useCamdict = (word: string) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [result, setResult] = useState<CamdictWordType>(null);

  useEffect(() => {
    if (!word) return;

    EnjoyApp.camdict.lookup(word).then((res) => {
      setResult(res);
    });
  }, [word]);

  return {
    result,
  };
};
