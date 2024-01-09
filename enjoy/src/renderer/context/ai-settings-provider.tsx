import { createContext, useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

type AISettingsProviderState = {
  openai?: LlmProviderType;
  setOpenai?: (config: LlmProviderType) => void;
  googleGenerativeAi?: LlmProviderType;
  setGoogleGenerativeAi?: (config: LlmProviderType) => void;
};

const initialState: AISettingsProviderState = {};

export const AISettingsProviderContext =
  createContext<AISettingsProviderState>(initialState);

export const AISettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [openai, setOpenai] = useState<LlmProviderType>(null);
  const [googleGenerativeAi, setGoogleGenerativeAi] =
    useState<LlmProviderType>(null);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const _openai = await EnjoyApp.settings.getLlm("openai");
    if (_openai) setOpenai(_openai);

    const _googleGenerativeAi = await EnjoyApp.settings.getLlm(
      "googleGenerativeAi"
    );
    if (_googleGenerativeAi) setGoogleGenerativeAi(_googleGenerativeAi);
  };

  const handleSetLlm = async (
    name: SupportedLlmProviderType,
    config: LlmProviderType
  ) => {
    await EnjoyApp.settings.setLlm(name, config);
    const _config = await EnjoyApp.settings.getLlm(name);

    switch (name) {
      case "openai":
        setOpenai(_config);
        break;
      case "googleGenerativeAi":
        setGoogleGenerativeAi(_config);
        break;
    }
  };

  return (
    <AISettingsProviderContext.Provider
      value={{
        openai,
        setOpenai: (config: LlmProviderType) => handleSetLlm("openai", config),
        googleGenerativeAi,
        setGoogleGenerativeAi: (config: LlmProviderType) =>
          handleSetLlm("googleGenerativeAi", config),
      }}
    >
      {children}
    </AISettingsProviderContext.Provider>
  );
};
