import { PostAudio } from "@renderer/components";
import { t } from "i18next";
import { MediaPlayer, MediaProvider, PlayerSrc } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

export const PostMedium = (props: { medium: MediumType }) => {
  const { medium } = props;
  if (!medium.sourceUrl) return null;

  return (
    <div className="space-y-2">
      {medium.mediumType == "Video" && (
        <>
          <div className="text-xs text-muted-foreground">
            {t("sharedAudio")}
          </div>
          <MediaPlayer
            poster={medium.coverUrl}
            src={{
              type: `${medium.mediumType.toLowerCase()}/${
                medium.extname.replace(".", "") || "mp4"
              }`,
              src: medium.sourceUrl,
            } as PlayerSrc}
          >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        </>
      )}

      {medium.mediumType == "Audio" && (
        <>
          <div className="text-xs text-muted-foreground">
            {t("sharedAudio")}
          </div>
          <PostAudio audio={medium} />
        </>
      )}
    </div>
  );
};
