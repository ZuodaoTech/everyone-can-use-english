import { useState, useEffect, useContext } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { Button, ScrollArea, ScrollBar } from "@renderer/components/ui";
import { AudioCard, MediaAddButton } from "@renderer/components";
import { t } from "i18next";
import { Link } from "react-router-dom";

export const AudiosSegment = (props: { limit?: number }) => {
  const { limit = 10 } = props;
  const [audios, setAudios] = useState<AudioType[]>([]);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    fetchResources();
    addDblistener(onAudioUpdate);

    return () => {
      removeDbListener(onAudioUpdate);
    };
  }, []);

  const fetchResources = async () => {
    const resources = await EnjoyApp.audios.findAll({
      limit,
    });
    if (!resources) return;

    setAudios(resources);
  };

  const onAudioUpdate = (event: CustomEvent) => {
    const { record, action, model } = event.detail || {};
    if (model !== "Audio") return;
    if (!record) return;

    if (action === "create") {
      setAudios([record as AudioType, ...audios]);
    } else if (action === "destroy") {
      setAudios(audios.filter((r) => r.id !== record.id));
    }
  };
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("addedAudios")}
          </h2>
        </div>
        <div className="ml-auto mr-4">
          <Link to="/audios">
            <Button variant="link" className="capitalize">
              {t("seeMore")}
            </Button>
          </Link>
        </div>
      </div>

      {audios.length === 0 ? (
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
          <MediaAddButton type="Audio" />
        </div>
      ) : (
        <ScrollArea>
          <div className="flex items-center space-x-4 pb-4">
            {audios.map((audio) => {
              return (
                <AudioCard className="w-36" key={audio.id} audio={audio} />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};
