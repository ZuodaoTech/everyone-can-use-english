import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { VideoPlayer } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";
import { MediaShadowProvider } from "@renderer/context";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const segmentIndex = searchParams.get("segmentIndex") || "0";

  return (
    <>
      <div className="h-screen flex flex-col relative">
        <div className="flex space-x-1 items-center h-12 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("shadowingVideo")}</span>
        </div>

        <MediaShadowProvider>
          <VideoPlayer id={id} segmentIndex={parseInt(segmentIndex)} />
        </MediaShadowProvider>
      </div>
    </>
  );
};
