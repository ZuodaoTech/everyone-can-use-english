import { t } from "i18next";
import { Button, ScrollArea, Separator } from "@renderer/components/ui";
import {
  About,
  ApiUrlSettings,
  Appearance,
  DefaultEngineSettings,
  Hotkeys,
  UserSettings,
  BalanceSettings,
  LibrarySettings,
  SttSettings,
  TtsSettings,
  OpenaiSettings,
  ProxySettings,
  ResetSettings,
  ResetAllSettings,
  NativeLanguageSettings,
  LearningLanguageSettings,
  NetworkState,
  RecorderSettings,
  VocabularySettings,
  DictSettings,
  DiskUsage,
} from "@renderer/components";
import { useState } from "react";
import { Tooltip } from "react-tooltip";
import { EmailSettings } from "./email-settings";

export const Preferences = () => {
  const TABS = [
    {
      value: "basic",
      label: t("basicSettingsShort"),
      component: () => (
        <div className="pr-1">
          <div className="font-semibold mb-4 capitilized">
            {t("basicSettings")}
          </div>
          <NativeLanguageSettings />
          <Separator />
          <LearningLanguageSettings />
          <Separator />
          <SttSettings />
          <Separator />
          <TtsSettings />
          <Separator />
          <DefaultEngineSettings />
          <Separator />
        </div>
      ),
    },
    {
      value: "dict",
      label: t("dictSettingsShort"),
      component: () => (
        <div className="pr-1">
          <div className="font-semibold mb-4 capitilized">
            {t("dictSettings")}
          </div>
          <VocabularySettings />
          <Separator />
          <DictSettings />
          <Separator />
        </div>
      ),
    },
    {
      value: "advanced",
      label: t("advancedSettingsShort"),
      component: () => (
        <>
          <div className="font-semibold mb-4 capitilized">
            {t("advancedSettings")}
          </div>
          <ApiUrlSettings />
          <Separator />
          <ProxySettings />
          <Separator />
          <NetworkState />
          <Separator />
          <OpenaiSettings />
          <Separator />
          <RecorderSettings />
          <Separator />
          <ResetSettings />
          <Separator />
          <ResetAllSettings />
          <Separator />
        </>
      ),
    },
    {
      value: "account",
      label: t("accountSettingsShort"),
      component: () => (
        <div className="pr-1">
          <div className="font-semibold mb-4 capitilized">
            {t("accountSettings")}
          </div>
          <UserSettings />
          <Separator />
          <LibrarySettings />
          <Separator />
          <DiskUsage />
          <Separator />
          <EmailSettings />
          <Separator />
          <BalanceSettings />
          <Separator />
        </div>
      ),
    },
    {
      value: "hotkeys",
      label: t("hotkeys"),
      component: () => <Hotkeys />,
    },
    {
      value: "appearance",
      label: t("appearance"),
      component: () => <Appearance />,
    },
    {
      value: "about",
      label: t("about"),
      component: () => <About />,
    },
  ];

  const [activeTab, setActiveTab] = useState<string>("basic");

  return (
    <>
      <div className="grid grid-cols-5 overflow-hidden h-full">
        <ScrollArea className="h-full col-span-1 bg-muted/50 p-4">
          <div className="py-2 text-muted-foreground mb-4">
            {t("sidebar.preferences")}
          </div>

          {TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "default" : "ghost"}
              size="sm"
              className={`capitilized w-full justify-start mb-2 ${
                activeTab === tab.value ? "" : "hover:bg-muted"
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              <span className="text-sm">{tab.label}</span>
            </Button>
          ))}
        </ScrollArea>
        <ScrollArea className="h-full col-span-4 py-6 px-10">
          {TABS.find((tab) => tab.value === activeTab)?.component()}
        </ScrollArea>
      </div>
      <Tooltip id="preferences-tooltip" />
    </>
  );
};
