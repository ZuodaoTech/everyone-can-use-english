import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { fetchFile } from "@ffmpeg/util";

export const useTranscribe = () => {
  const { EnjoyApp, ffmpeg } = useContext(AppSettingsProviderContext);

  const transcode = async (src: string, options?: string[]) => {
    if (!ffmpeg?.loaded) return;

    options = options || ["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"];

    try {
      const uri = new URL(src);
      const input = uri.pathname.split("/").pop();
      const output = input.replace(/\.[^/.]+$/, ".wav");
      await ffmpeg.writeFile(input, await fetchFile(src));
      await ffmpeg.exec(["-i", input, ...options, output]);
      const data = await ffmpeg.readFile(output);
      return new Blob([data], { type: "audio/wav" });
    } catch (e) {
      toast.error(t("transcodeError"));
    }
  };

  const transcribe = async (params: {
    mediaSrc: string;
    mediaId: string;
    mediaType: "Audio" | "Video";
  }) => {
    const { mediaSrc, mediaId, mediaType } = params;
    const data = await transcode(mediaSrc);
    let blob;
    if (data) {
      blob = {
        type: data.type.split(";")[0],
        arrayBuffer: await data.arrayBuffer(),
      };
    }

    return EnjoyApp.transcriptions.process(
      {
        targetId: mediaId,
        targetType: mediaType,
      },
      {
        blob,
      }
    );
  };

  return {
    transcode,
    transcribe,
  };
};
