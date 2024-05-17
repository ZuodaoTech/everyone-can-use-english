import { Input, Button } from "@renderer/components/ui";
import { t } from "i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const StoryForm = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  return (
    <>
      <div className="w-full flex items-center">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-r-none rounded-l-full h-10 focus-visible:ring-0 px-4"
          placeholder={t("inputUrlToStartReading")}
        />
        <Button
          disabled={!url}
          onClick={() =>
            navigate(`/stories/preview/${encodeURIComponent(url)}`)
          }
          className="rounded-l-none rounded-r-full h-10 px-6 border-primary border-1 capitilize min-w-fit"
        >
          {t("read")}
        </Button>
      </div>
    </>
  );
};
