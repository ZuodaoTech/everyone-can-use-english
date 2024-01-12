import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { PostAudioPlayer } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import Markdown from "react-markdown";
import { BotIcon, CheckIcon, CopyPlusIcon, PlusCircleIcon } from "lucide-react";
import { useCopyToClipboard } from "@uidotdev/usehooks";

export const PostActions = (props: { post: PostType }) => {
  const { post } = props;
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);

  return (
    <div className="flex items-center space-x-2 justify-end">
      {post.target && post.targetType === "Medium" && (
        <Button variant="ghost" size="sm" className="px-1.5 rounded-full">
          <PlusCircleIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("addToLibary")}
            className="w-5 h-5 text-muted-foreground hover:text-primary"
          />
        </Button>
      )}
      {typeof post.metadata?.content === "string" && (
        <Button variant="ghost" size="sm" className="px-1.5 rounded-full">
          {copied ? (
            <CheckIcon className="w-5 h-5 text-green-500" />
          ) : (
            <CopyPlusIcon
              data-tooltip-id="global-tooltip"
              data-tooltip-content={t("copy")}
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
        <Button variant="ghost" size="sm" className="px-1.5 rounded-full">
          <BotIcon className="w-5 h-5 text-muted-foreground hover:text-primary" />
        </Button>
      )}
    </div>
  );
};
