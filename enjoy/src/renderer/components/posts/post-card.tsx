import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  PostRecording,
  PostActions,
  PostMedium,
  PostStory,
  PostOptions,
} from "@renderer/components";
import { Avatar, AvatarImage, AvatarFallback } from "@renderer/components/ui";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import Markdown from "react-markdown";

export const PostCard = (props: {
  post: PostType;
  handleDelete: (id: string) => void;
}) => {
  const { post, handleDelete } = props;
  const { user } = useContext(AppSettingsProviderContext);

  return (
    <div className="rounded p-4 bg-background space-y-3">
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

        {post.user.id == user.id && (
          <PostOptions handleDelete={() => handleDelete(post.id)} />
        )}
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

      {post.targetType == "Recording" && (
        <>
          <div className="text-xs text-muted-foreground">
            {t("sharedRecording")}
          </div>
          <PostRecording recording={post.target as RecordingType} />
        </>
      )}

      {post.targetType == "Story" && (
        <>
          <div className="text-xs text-muted-foreground">
            {t("sharedStory")}
          </div>
          <PostStory story={post.target as StoryType} />
        </>
      )}

      <PostActions post={post} />
    </div>
  );
};
