import { Avatar, AvatarFallback, AvatarImage } from "@renderer/components/ui";
import { MarkdownWrapper } from "@renderer/components";
import { formatDateTime } from "@renderer/lib/utils";

export const LlmMessage = (props: { llmMessage: LlmMessageType }) => {
  const { llmMessage } = props;

  return (
    <>
      {llmMessage.query && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 justify-end mb-2">
            <div className="text-sm text-muted-foreground">
              {llmMessage.user.name}
            </div>
            <Avatar className="w-8 h-8 bg-background avatar">
              <AvatarImage src={llmMessage.user.avatarUrl}></AvatarImage>
              <AvatarFallback className="bg-background">
                {llmMessage.user.name}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-2 px-4 py-2 mb-2 bg-sky-500/30 border-sky-500 rounded-lg shadow-sm max-w-full">
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {llmMessage.query}
            </MarkdownWrapper>
          </div>
          {llmMessage.createdAt && (
            <div className="flex justify-end text-xs text-muted-foreground">
              {formatDateTime(llmMessage.createdAt)}
            </div>
          )}
        </div>
      )}
      {llmMessage.response && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="w-8 h-8 bg-background avatar">
              <AvatarImage src={llmMessage.agent.avatarUrl}></AvatarImage>
              <AvatarFallback className="bg-background">AI</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {llmMessage.agent.name}
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-2 mb-2 bg-background border rounded-lg shadow-sm max-w-full">
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {llmMessage.response}
            </MarkdownWrapper>
          </div>
          {llmMessage.createdAt && (
            <div className="flex justify-start text-xs text-muted-foreground">
              {formatDateTime(llmMessage.createdAt)}
            </div>
          )}
        </div>
      )}
    </>
  );
};
