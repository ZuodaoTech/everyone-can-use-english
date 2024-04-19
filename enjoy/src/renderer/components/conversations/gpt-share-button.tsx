import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast
} from "@renderer/components/ui";
import { Share2Icon } from "lucide-react";

export const GPTShareButton = (props: {
  conversation: Partial<ConversationType>;
}) => {
  const { conversation } = props;
  const { webApi } = useContext(AppSettingsProviderContext);
  const navigate = useNavigate();

  const handleShare = () => {
    const { configuration } = conversation;
    delete configuration.baseUrl;
    delete configuration?.tts?.baseUrl;

    if (!configuration.roleDefinition) {
      toast.error("shareFailed");
      return;
    }

    webApi
      .createPost({
        metadata: {
          type: "gpt",
          content: {
            name: conversation.name,
            engine: conversation.engine,
            configuration,
          },
        },
      })
      .then(() => {
        toast.success(t("sharedSuccessfully"), {
          description: t("sharedGpt"),
          action: {
            label: t("view"),
            onClick: () => {
              navigate("/community");
            },
          },
          actionButtonStyle: {
            backgroundColor: "var(--primary)",
          },
        });
      })
      .catch((err) => {
        toast.error(t("shareFailed"), { description: err.message });
      });
  };

  if (!conversation.id) return null;
  if (conversation.type !== "gpt") return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link" size="icon" className="rounded-full p-0 w-6 h-6">
          <Share2Icon className="w-4 h-4 text-muted-foreground" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("shareGpt")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("areYouSureToShareThisGptToCommunity")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="default" onClick={handleShare}>
              {t("share")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
