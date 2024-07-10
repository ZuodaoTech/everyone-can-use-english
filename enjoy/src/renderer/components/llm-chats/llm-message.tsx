import { Avatar, AvatarFallback, AvatarImage } from "@renderer/components/ui";
import { MarkdownWrapper } from "../misc";

export const LlmMessage = (props: { llmMessage: LlmMessageType }) => {
  const { llmMessage } = props;

  return (
    <>
      {llmMessage.query && (
        <div className="flex items-end justify-end space-x-2 pr-10">
          <Avatar className="w-8 h-8 bg-background avatar">
            <AvatarImage src={llmMessage.user.avatarUrl}></AvatarImage>
            <AvatarFallback className="bg-background">
              {llmMessage.user.name}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 px-4 py-2 bg-sky-500/30 border-sky-500 rounded-lg shadow-sm w-full">
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {llmMessage.query}
            </MarkdownWrapper>
          </div>
        </div>
      )}
      {llmMessage.response && (
        <div className="flex items-end space-x-2 pr-10">
          <Avatar className="w-8 h-8 bg-background avatar">
            <AvatarImage src={llmMessage.agent.avatarUrl}></AvatarImage>
            <AvatarFallback className="bg-background">AI</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 px-4 py-2 bg-background border rounded-lg shadow-sm max-w-full">
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {llmMessage.response}
            </MarkdownWrapper>
          </div>
        </div>
      )}
    </>
  );
};
