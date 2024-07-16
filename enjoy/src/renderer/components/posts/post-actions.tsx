import { useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { ConversationShortcuts, SpeechPlayer } from "@renderer/components";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  Button,
  toast,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@renderer/components/ui";
import { t } from "i18next";
import Markdown from "react-markdown";
import {
  BotIcon,
  CheckIcon,
  CopyPlusIcon,
  PlusCircleIcon,
  ChevronRightIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Link } from "react-router-dom";

export const PostActions = (props: {
  post: PostType;
  handleUpdate: (post: PostType) => void;
}) => {
  const { post, handleUpdate } = props;
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const [asking, setAsking] = useState<boolean>(false);
  const [aiReplies, setAiReplies] = useState<Partial<MessageType>[]>([]);

  const handleAddMedium = async () => {
    if (post.targetType !== "Medium") return;
    const medium = post.target as MediumType;
    if (!medium) return;

    if (medium.mediumType === "Video") {
      try {
        const video = await EnjoyApp.videos.findOne({ md5: medium.md5 });
        if (video) {
          toast.info(t("videoAlreadyAddedToLibrary"));
          return;
        }
      } catch (error) {
        console.error(error);
      }

      EnjoyApp.videos
        .create(medium.sourceUrl, {
          coverUrl: medium.coverUrl,
          md5: medium.md5,
        })
        .then(() => {
          toast.success(t("videoSuccessfullyAddedToLibrary"));
        });
    } else if (medium.mediumType === "Audio") {
      try {
        const audio = await EnjoyApp.audios.findOne({ md5: medium.md5 });
        if (audio) {
          toast.info(t("audioAlreadyAddedToLibrary"));
          return;
        }
      } catch (error) {
        toast.error(error.message);
      }

      EnjoyApp.audios
        .create(medium.sourceUrl, {
          coverUrl: medium.coverUrl,
          md5: medium.md5,
        })
        .then(() => {
          toast.success(t("audioSuccessfullyAddedToLibrary"));
        });
    }
  };

  const toggleLike = async () => {
    if (post.liked) {
      webApi
        .unlikePost(post.id)
        .then((p) => handleUpdate(p))
        .catch((err) => toast.error(err.message));
    } else {
      webApi
        .likePost(post.id)
        .then((p) => handleUpdate(p))
        .catch((err) => toast.error(err.message));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 justify-end">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-1.5 rounded-full"
                onClick={toggleLike}
              >
                <ThumbsUpIcon
                  className={`w-5 h-5 ${
                    post.liked ? "text-red-600" : "text-muted-foreground"
                  }`}
                />
                {typeof post.likesCount === "number" && post.likesCount > 0 && (
                  <span className="ml-1 text-sm">{post.likesCount}</span>
                )}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="max-h-48 overflow-y-auto">
                {post.likeByUsers?.length === 0 && (
                  <div className="text-center text-muted-foreground">
                    {t("noLikesYet")}
                  </div>
                )}
                <div className="grid grid-cols-6 gap-2">
                  {post.likeByUsers?.map((user) => (
                    <Link
                      key={user.id}
                      to={`/users/${user.id}`}
                      className="aspect-square"
                    >
                      <Avatar className="w-full h-full">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xl">
                          {user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <div className="flex items-center space-x-2 justify-end">
          {post.target && post.targetType === "Medium" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("addToLibary")}
                  data-tooltip-place="bottom"
                  variant="ghost"
                  size="sm"
                  className="px-1.5 rounded-full"
                >
                  <PlusCircleIcon className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("addResource")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {(post.target as MediumType).mediumType === "Video" &&
                      t("areYouSureToAddThisVideoToYourLibrary")}

                    {(post.target as MediumType).mediumType === "Audio" &&
                      t("areYouSureToAddThisAudioToYourLibrary")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddMedium}>
                    {t("confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {typeof post.metadata?.content === "string" && (
            <Button
              data-tooltip-id="global-tooltip"
              data-tooltip-content={t("copy")}
              data-tooltip-place="bottom"
              variant="ghost"
              size="sm"
              className="px-1.5 rounded-full"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5 text-green-500" />
              ) : (
                <CopyPlusIcon
                  className="w-5 h-5 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    copyToClipboard(post.metadata.content as string);
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                    }, 3000);
                  }}
                />
              )}
            </Button>
          )}

          {post.metadata?.type === "prompt" && (
            <ConversationShortcuts
              open={asking}
              onOpenChange={setAsking}
              prompt={post.metadata.content as string}
              onReply={(replies) => {
                setAiReplies([...aiReplies, ...replies]);
                setAsking(false);
              }}
              trigger={
                <Button
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("sendToAIAssistant")}
                  data-tooltip-place="bottom"
                  variant="ghost"
                  size="sm"
                  className="px-1.5 rounded-full"
                >
                  <BotIcon className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              }
            />
          )}

          {post.metadata?.type === "gpt" && (
            <>
              <Button
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("copy")}
                data-tooltip-place="bottom"
                variant="ghost"
                size="sm"
                className="px-1.5 rounded-full"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <CopyPlusIcon
                    className="w-5 h-5 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      copyToClipboard(
                        (post.metadata.content as { [key: string]: any })
                          .configuration.roleDefinition as string
                      );
                      setCopied(true);
                      setTimeout(() => {
                        setCopied(false);
                      }, 3000);
                    }}
                  />
                )}
              </Button>

              <Link to={`/conversations?postId=${post.id}`}>
                <Button
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("saveAiAssistant")}
                  data-tooltip-place="bottom"
                  variant="ghost"
                  size="sm"
                  className="px-1.5 rounded-full"
                >
                  <PlusCircleIcon className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {aiReplies.length > 0 && <AIReplies replies={aiReplies} />}
    </>
  );
};

const AIReplies = (props: { replies: Partial<MessageType>[] }) => {
  return (
    <div>
      <div className="space-y-2">
        {props.replies.map((reply) => (
          <div key={reply.id} className="bg-muted py-2 px-4 rounded">
            <div className="mb-2 flex items-center justify-between">
              <BotIcon className="w-5 h-5 text-blue-500" />
              <Link to={`/conversations/${reply.conversationId}`}>
                <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
            <Markdown className="prose select-text">{reply.content}</Markdown>
            {reply.speeches?.map((speech) => (
              <SpeechPlayer key={speech.id} speech={speech} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
