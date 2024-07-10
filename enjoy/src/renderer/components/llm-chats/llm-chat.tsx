import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { toast } from "@renderer/components/ui";
import { LoaderSpin } from "@renderer/components";
import { t } from "i18next";

export const LlmChat = (props: {
  id?: string;
  agentType?: string;
  agentId?: string;
}) => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const { id, agentType, agentId } = props;
  const [llmChat, setLlmChat] = useState<LLmChatType | null>(null);
  const [loading, setLoading] = useState(false);

  const findOrCreateChat = async () => {
    if (id) {
      setLoading(true);
      webApi
        .llmChat(id)
        .then((chat) => {
          setLlmChat(chat);
        })
        .catch((err) => {
          toast.error(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (agentId && agentType) {
      setLoading(true);
      webApi
        .createLlmChat({ agentId, agentType })
        .then((chat) => {
          setLlmChat(chat);
        })
        .catch((err) => {
          toast.error(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    findOrCreateChat();
  }, [id, agentType, agentId]);

  if (loading) return <LoaderSpin />;

  if (!llmChat)
    return (
      <div className="flex items-center justify-center py-6">{t("noData")}</div>
    );

  return <div className="max-w-screen-lg mx-auto">{llmChat.agent.name}</div>;
};
