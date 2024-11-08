import {
  AudiosSegment,
  AudibleBooksSegment,
  DocumentsSegment,
  VideosSegment,
  YoutubeVideosSegment,
  EnrollmentSegment,
} from "@renderer/components";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button } from "@renderer/components/ui";
import { t } from "i18next";
import semver from "semver";
import { DOWNLOAD_URL } from "@/constants";

export default () => {
  const [channels, setChannels] = useState<string[]>([
    "@TED",
    "@CNN",
    "@nytimes",
  ]);

  const { webApi } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    if (!webApi) return;

    webApi.config("ytb_channels").then((channels) => {
      if (!channels) return;

      setChannels(channels);
    });
  }, [webApi]);

  return (
    <div className="w-full relative">
      <AuthorizationStatusBar />
      <UpgradeNotice />
      <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
        <div className="space-y-4">
          <EnrollmentSegment />
          <AudiosSegment />
          <VideosSegment />
          <DocumentsSegment />
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
  if (!user) return null;

  if (!user.accessToken) {
    return (
      <div className="bg-destructive text-white py-2 px-4 h-10 flex items-center sticky top-0 z-10">
        <span className="text-sm">{t("authorizationExpired")}</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 py-1 px-2 text-xs h-auto w-auto"
          onClick={logout}
        >
          {t("reLogin")}
        </Button>
      </div>
    );
  }

  return null;
};

const UpgradeNotice = () => {
  const { version, latestVersion, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );
  if (!latestVersion) return null;

  // compare version with latestVersion by semver
  if (semver.gte(version, latestVersion)) return null;

  return (
    <div className="bg-blue-500 text-white py-2 px-4 h-10 flex items-center sticky top-0">
      <span className="text-sm">
        {t("upgradeNotice", { version: latestVersion })}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="ml-2 py-1 px-2 text-xs h-auto w-auto"
        onClick={() => {
          EnjoyApp.shell.openExternal(DOWNLOAD_URL);
        }}
      >
        {t("upgrade")}
      </Button>
    </div>
  );
};
