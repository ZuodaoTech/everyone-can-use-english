import { useParams, useNavigate } from "react-router-dom";
import { AudioPlayer } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";
import { MediaPlayerProvider } from "@renderer/context";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <div className="h-full relative">
        <div className="flex space-x-1 items-center h-14 px-4 xl:px-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("shadowingAudio")}</span>
        </div>

        <MediaPlayerProvider height={240}>
          <AudioPlayer id={id} />
        </MediaPlayerProvider>
      </div>
    </>
  );
};
