import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  toast,
} from "@renderer/components/ui";
import { ChatAgentCard, ChatAgentForm } from "@renderer/components";
import { PlusIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { t } from "i18next";
import { useDebounce } from "@uidotdev/usehooks";
import { AppSettingsProviderContext } from "@/renderer/context";

export const ChatAgents = (props: {
  chatAgents: ChatAgentType[];
  fetchChatAgents: (query?: string) => void;
  currentChatAgent: ChatAgentType;
  setCurrentChatAgent: (chatAgent: ChatAgentType) => void;
}) => {
  const { currentChatAgent, setCurrentChatAgent, chatAgents, fetchChatAgents } =
    props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [deletingChatAgent, setDeletingChatAgent] =
    useState<ChatAgentType>(null);
  const [editingChatAgent, setEditingChatAgent] = useState<ChatAgentType>(null);
  const [creatingChatAgent, setCreatingChatAgent] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  const handleDeleteChatAgent = () => {
    if (!deletingChatAgent) return;

    if (currentChatAgent?.id === deletingChatAgent.id) {
      setCurrentChatAgent(null);
    }

    EnjoyApp.chatAgents
      .destroy(deletingChatAgent.id)
      .then(() => {
        toast.success(t("models.chatAgent.deleted"));
        setDeletingChatAgent(null);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  useEffect(() => {
    if (currentChatAgent) return;

    setCurrentChatAgent(chatAgents[0]);
  }, [chatAgents]);

  useEffect(() => {
    fetchChatAgents(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <>
      <div className="overflow-y-auto h-full relative py-2 px-1">
        <div className="sticky flex items-center space-x-2 py-2 px-1">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded h-8 text-xs"
            placeholder={t("search")}
          />
          <Button
            className="w-8 h-8 p-0"
            variant="ghost"
            size="icon"
            onClick={() => setCreatingChatAgent(true)}
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
        {chatAgents.length === 0 && (
          <div className="text-center my-4">
            <span className="text-sm text-muted-foreground">{t("noData")}</span>
          </div>
        )}
        <div className="grid gap-1">
          {chatAgents.map((chatAgent) => (
            <ChatAgentCard
              key={chatAgent.id}
              chatAgent={chatAgent}
              selected={currentChatAgent?.id === chatAgent.id}
              onSelect={setCurrentChatAgent}
              onEdit={setEditingChatAgent}
              onDelete={setDeletingChatAgent}
            />
          ))}
        </div>
      </div>
      <AlertDialog
        open={!!deletingChatAgent}
        onOpenChange={() => setDeletingChatAgent(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t("deleteChatAgent")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteChatAgentConfirmation")}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingChatAgent(null)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive-hover"
              onClick={handleDeleteChatAgent}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!editingChatAgent}
        onOpenChange={() => setEditingChatAgent(null)}
      >
        <DialogContent className="max-w-screen-md max-h-full overflow-auto">
          <DialogTitle className="sr-only">Edit Chat Agent</DialogTitle>
          <DialogDescription className="sr-only">
            Edit chat agent configuration
          </DialogDescription>
          <ChatAgentForm
            agent={editingChatAgent}
            onFinish={() => setEditingChatAgent(null)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={creatingChatAgent} onOpenChange={setCreatingChatAgent}>
        <DialogContent className="max-w-screen-md max-h-full overflow-auto">
          <DialogTitle className="sr-only">Create Chat Agent</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new chat agent
          </DialogDescription>
          <ChatAgentForm
            agent={null}
            onFinish={() => setCreatingChatAgent(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
