import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { PostAudioPlayer, PostActions } from "@renderer/components";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
} from "@renderer/components/ui";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import Markdown from "react-markdown";

export const PostCard = (props: { post: PostType }) => {
  const { post } = props;

  return (
    <div className="rounded p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={post.user.avatarUrl} />
            <AvatarFallback className="text-xl">
              {post.user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-between">
            <div className="">{post.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(post.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {post.metadata?.type === "prompt" && (
        <>
          <div className="text-xs text-muted-foreground">
            {t("sharedPrompt")}
          </div>
          <Markdown className="prose prose-slate prose-pre:whitespace-normal select-text">
            {"```prompt\n" + post.metadata.content + "\n```"}
          </Markdown>
        </>
      )}

      {post.targetType == "Medium" && (
        <PostMedium medium={post.target as MediumType} />
      )}

      <PostActions post={post} />
    </div>
  );
};

const PostMedium = (props: { medium: MediumType }) => {
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
            }}
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
          <PostAudioPlayer src={medium.sourceUrl} />
        </>
      )}

      {medium.coverUrl && medium.mediumType == "Audio" && (
        <div className="">
          <img src={medium.coverUrl} className="w-full rounded" />
        </div>
      )}
    </div>
  );
};

const PostOptions = (props: { post: PostType }) => {};
