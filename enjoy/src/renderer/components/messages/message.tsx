import {
  AssistantMessageComponent,
  UserMessageComponent,
} from "@renderer/components";

export const MessageComponent = (props: {
  message: MessageType;
  configuration: { [key: string]: any };
  onResend: () => void;
  onRemove: () => void;
}) => {
  const { message, configuration, onResend, onRemove } = props;
  if (message.role === "assistant") {
    return (
      <AssistantMessageComponent
        message={message}
        configuration={configuration}
        onRemove={onRemove}
      />
    );
  } else if (message.role === "user") {
    return (
      <UserMessageComponent
        message={message}
        configuration={configuration}
        onResend={onResend}
        onRemove={onRemove}
      />
    );
  }
};
