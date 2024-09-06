import {
  AudiosSegment,
  AudibleBooksSegment,
  StoriesSegment,
  VideosSegment,
  YoutubeVideosSegment,
  EnrollmentSegment,
} from "@renderer/components";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button } from "@renderer/components/ui";
import { t } from "i18next";

export default () => {
  const [channels, setChannels] = useState<string[]>([
    "@TED",
    "@CNN",
    "@nytimes",
  ]);

  const { webApi } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    webApi.config("ytb_channels").then((channels) => {
      if (!channels) return;

      setChannels(channels);
    });
  }, []);

  return (
    <div className="relative">
      <AuthorizationStatusBar />
      <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
        <div className="space-y-4">
          <EnrollmentSegment />
          <AudiosSegment />
          <VideosSegment />
          <StoriesSegment />
          <AudibleBooksSegment />
          {channels.map((channel) => (
            <YoutubeVideosSegment key={channel} channel={channel} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AuthorizationStatusBar = () => {
  const { user, logout } = useContext(AppSettingsProviderContext);

  if (user.accessToken === null) {
    return (
      <div className="bg-red-500 text-white py-2 px-4 h-12 flex items-center sticky top-0">
        <span className="text-sm">{t("authorizationExpired")}</span>
        <Button variant="outline" size="sm" className="ml-2" onClick={logout}>
          {t("reLogin")}
        </Button>
      </div>
    );
  }

  return null;
};
