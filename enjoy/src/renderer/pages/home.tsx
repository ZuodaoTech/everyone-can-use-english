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
  );
};
