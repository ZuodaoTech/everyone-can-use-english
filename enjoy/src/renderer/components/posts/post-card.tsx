import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  PostRecording,
  PostActions,
  PostMedium,
  PostStory,
  PostOptions,
  PostNote,
} from "@renderer/components";
import { Avatar, AvatarImage, AvatarFallback } from "@renderer/components/ui";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";

export const PostCard = (props: {
  post: PostType;
  handleDelete: (id: string) => void;
  handleUpdate: (post: PostType) => void;
}) => {
  const { post, handleDelete, handleUpdate } = props;
  const { user } = useContext(AppSettingsProviderContext);

  return (
    <div className="p-4 rounded-lg space-y-3 hover:bg-muted">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to={`/users/${post.user.id}`}>
            <Avatar>
              <AvatarImage src={post.user.avatarUrl} />
              <AvatarFallback className="text-xl">
                {post.user.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
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
          <Markdown className="prose prose-slate prose-pre:whitespace-pre-line dark:prose-invert select-text">
            {"```prompt\n" + post.metadata.content + "\n```"}
          </Markdown>
        </>
      )}

      {post.metadata?.type === "gpt" && (
        <>
          <div className="text-xs text-muted-foreground">{t("sharedGpt")}</div>
          <div className="text-sm">
            {t("models.conversation.roleDefinition")}:
          </div>
          <div className="prose prose-stone prose-pre:whitespace-pre-line dark:prose-invert select-text">
            <blockquote className="not-italic whitespace-pre-line">
              <Markdown>
                {
                  (post.metadata.content as { [key: string]: any })
                    .configuration?.roleDefinition
                }
              </Markdown>
            </blockquote>
          </div>
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

      {post.targetType == "Note" && (
        <>
          <div className="text-xs text-muted-foreground">{t("sharedNote")}</div>
          <PostNote note={post.target as NoteType} />
        </>
      )}

      <PostActions post={post} handleUpdate={handleUpdate} />
    </div>
  );
};
