import {
  Button,
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "@renderer/components/ui";
import { UsersRankings, Posts } from "@renderer/components";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";

export default () => {
  const navigate = useNavigate();

  return (
    <div className="bg-muted h-full px-4 lg:px-8 py-6">
      <div className="max-w-screen-md mx-auto">
        <div className="flex space-x-1 items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("sidebar.community")}</span>
        </div>

        <Tabs defaultValue="square">
          <TabsList className="mb-6">
            <TabsTrigger value="square">{t("square")}</TabsTrigger>
            <TabsTrigger
              value="rankings"
              disabled
              className="cursor-not-allowed"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={t("comingSoon")}
            >
              {t("rankings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="square">
            <Posts />
          </TabsContent>

          <TabsContent value="rankings"></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
