import {
  AudiosSegment,
  AudibleBooksSegment,
  StoriesSegment,
  TedIdeasSegment,
  VideosSegment,
  TedTalksSegment,
  YoutubeVideosSegment,
} from "@renderer/components";

export default () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
      <div className="space-y-4">
        <AudiosSegment />
        <VideosSegment />
        <StoriesSegment />
        <AudibleBooksSegment />
        <TedTalksSegment />
        <TedIdeasSegment />
        <YoutubeVideosSegment channel="@TED" />
        <YoutubeVideosSegment channel="@CNN" />
        <YoutubeVideosSegment channel="@nytimes" />
      </div>
    </div>
  );
};
