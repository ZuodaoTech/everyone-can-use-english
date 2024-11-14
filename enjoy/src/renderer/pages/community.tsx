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
    <div className="min-h-full px-4 lg:px-8 py-6 max-w-screen-md mx-auto">
      <Tabs defaultValue="square">
        <TabsList className="mb-4">
          <TabsTrigger value="square">{t("square")}</TabsTrigger>
          <TabsTrigger value="rankings">{t("rankings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="square">
          <Posts />
        </TabsContent>

        <TabsContent value="rankings">
          <UsersRankings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
