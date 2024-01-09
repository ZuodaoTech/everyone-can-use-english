import { useParams , useNavigate } from "react-router-dom";
import { VideoDetail } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <div className="h-full px-4 py-6 xl:px-8">
        <div className="flex space-x-1 items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("shadowingVideo")}</span>
        </div>

        <VideoDetail id={id} />
      </div>
    </>
  );
};
