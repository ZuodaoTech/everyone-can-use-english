import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback } from "@renderer/components/ui";
import { UsersRoundIcon } from "lucide-react";

export const ChatCard = (props: {
  chat: ChatType;
  selected?: boolean;
  onSelect: (chat: ChatType) => void;
}) => {
  const { chat, selected = false, onSelect } = props;
  return (
    <div
      key={chat.id}
      className={`flex items-center space-x-2 rounded-lg p-2 hover:bg-muted cursor-pointer ${
        selected ? "bg-muted" : ""
      }`}
      onClick={() => onSelect(chat)}
    >
      {chat.membersCount > 2 ? (
        <UsersRoundIcon className="w-4 h-4" />
      ) : (
        <ChatBubbleIcon className="w-4 h-4" />
      )}
      <div className="flex-1 text-sm line-clamp-1">{chat.name}</div>
    </div>
  );
};
