import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { EllipsisIcon, UsersRoundIcon } from "lucide-react";
import { t } from "i18next";

export const ChatCard = (props: {
  chat: ChatType;
  selected: boolean;
  onSelect: (chat: ChatType) => void;
  onDelete: (chat: ChatType) => void;
}) => {
  const { chat, selected = false, onSelect, onDelete } = props;
  return (
    <div
      key={chat.id}
      className={`flex items-center space-x-2 rounded-lg px-2 py-1 hover:bg-muted/50 cursor-pointer ${
        selected ? "bg-muted/50" : ""
      }`}
      onClick={() => onSelect(chat)}
    >
      {chat.membersCount > 2 ? (
        <UsersRoundIcon className="w-4 h-4" />
      ) : (
        <ChatBubbleIcon className="w-4 h-4" />
      )}
      <div className="flex-1 text-sm font-serif line-clamp-1">{chat.title}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-4">
            <EllipsisIcon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onDelete(chat)}>
            <span className="text-destructive">{t("delete")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
