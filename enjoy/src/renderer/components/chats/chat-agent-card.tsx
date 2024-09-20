import { Avatar, AvatarFallback } from "@renderer/components/ui";

export const ChatAgentCard = (props: {
  chatAgent: ChatAgentType;
  selected?: boolean;
  onSelect?: (chatAgent: ChatAgentType) => void;
}) => {
  const { chatAgent, selected = false, onSelect } = props;

  return (
    <div
      className={`flex items-center space-x-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-muted ${
        selected ? "bg-muted" : ""
      }`}
      onClick={() => onSelect?.(chatAgent)}
    >
      <Avatar className="w-8 h-8">
        <img src={chatAgent.avatarUrl} alt={chatAgent.name} />
        <AvatarFallback>{chatAgent.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-sm line-clamp-1">{chatAgent.name}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">
          {chatAgent.introduction}
        </div>
      </div>
    </div>
  );
};
