import { t } from "i18next";
import { Button, ScrollArea } from "@renderer/components/ui";
import {
  BasicSettings,
  AdvancedSettings,
  About,
  Hotkeys,
} from "@renderer/components";
import { useState } from "react";

export const Preferences = () => {
  const TABS = [
    {
      value: "basic",
      label: t("basicSettingsShort"),
      component: () => <BasicSettings />,
    },
    {
      value: "advanced",
      label: t("advancedSettingsShort"),
      component: () => <AdvancedSettings />,
    },
    {
      value: "hotkeys",
      label: t("hotkeys"),
      component: () => <Hotkeys />,
    },
    {
      value: "about",
      label: t("about"),
      component: () => <About />,
    },
  ];

  const [activeTab, setActiveTab] = useState<string>("basic");

  return (
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
  );
};
