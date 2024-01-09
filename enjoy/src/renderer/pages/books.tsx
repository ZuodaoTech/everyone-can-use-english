import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";

export default () => {
  const navigate = useNavigate();

  return (
    <div className="h-full max-w-5xl mx-auto px-4 py-6">
      <div className="flex space-x-1 items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span>{t("sidebar.books")}</span>
      </div>
    </div>
  );
};
