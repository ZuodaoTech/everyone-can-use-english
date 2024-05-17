import { MessageCircleIcon, SpeechIcon } from "lucide-react";
import dayjs from "@renderer/lib/dayjs";

export const ConversationCard = (props: { conversation: ConversationType }) => {
  const { conversation } = props;

  return (
    <div
      className="bg-background hover:bg-muted hover:text-muted-foreground border rounded-full w-full mb-2 px-4 py-2 cursor-pointer flex items-center"
      style={{
        borderLeftColor: `#${conversation.id.replaceAll("-", "").slice(0, 6)}`,
        borderLeftWidth: 3,
      }}
    >
      <div className="">
        {conversation.type === "gpt" && <MessageCircleIcon className="mr-2" />}

        {conversation.type === "tts" && <SpeechIcon className="mr-2" />}
      </div>
      <div className="flex-1 flex items-center justify-between space-x-4">
        <div className="">
          <div className="line-clamp-1 text-sm">{conversation.name}</div>
          <div className="text-xs text-muted-foreground">
            {conversation.engine} /{" "}
            {conversation.type === "tts"
              ? conversation.configuration?.tts?.model
              : conversation.model}
          </div>
        </div>
        <span className="min-w-fit text-sm text-muted-foreground">
          {dayjs(conversation.createdAt).format("HH:mm l")}
        </span>
      </div>
    </div>
  );
};
