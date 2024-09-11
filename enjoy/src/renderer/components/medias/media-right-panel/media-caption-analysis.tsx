import { useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button, toast, TabsContent } from "@renderer/components/ui";
import { ConversationShortcuts } from "@renderer/components";
import { t } from "i18next";
import { BotIcon } from "lucide-react";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";
import { md5 } from "js-md5";
import Markdown from "react-markdown";

export function MediaCaptionAnalysis(props: { text: string }) {
  const { text } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>();

  const { analyzeText } = useAiCommand();

  const analyzeSentence = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    analyzeText(text, `analyze-${md5(text)}`)
      .then((result) => {
        if (result) {
          setAnalysisResult(result);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        setAnalyzing(false);
      });
  };

  /*
   * If the caption is changed, then reset the analysis.
   * Also, check if the translation is cached, then use it.
   */
  useEffect(() => {
    EnjoyApp.cacheObjects.get(`analyze-${md5(text)}`).then((cached) => {
      setAnalysisResult(cached);
    });
  }, [text]);

  return (
    <TabsContent value="analysis">
      {analysisResult ? (
        <>
          <Markdown
            className="select-text prose dark:prose-invert prose-sm prose-h3:text-base max-w-full mb-4"
            components={{
              a({ node, children, ...props }) {
                try {
                  new URL(props.href ?? "");
                  props.target = "_blank";
                  props.rel = "noopener noreferrer";
                } catch (e) {}

                return <a {...props}>{children}</a>;
              },
            }}
          >
            {analysisResult}
          </Markdown>

          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={analyzing}
              onClick={analyzeSentence}
            >
              {analyzing && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              {t("reAnalyze")}
            </Button>
            <AIButton
              prompt={text as string}
              onReply={(replies) => {
                const result = replies.map((m) => m.content).join("\n");
                setAnalysisResult(result);
                EnjoyApp.cacheObjects.set(`analyze-${md5(text)}`, result);
              }}
              tooltip={t("useAIAssistantToAnalyze")}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button size="sm" disabled={analyzing} onClick={analyzeSentence}>
            {analyzing && <LoaderIcon className="animate-spin w-4 h-4 mr-2" />}
            <span>{t("analyzeSentence")}</span>
          </Button>
          <AIButton
            prompt={text as string}
            onReply={(replies) => {
              const result = replies.map((m) => m.content).join("\n");
              setAnalysisResult(result);
              EnjoyApp.cacheObjects.set(`analyze-${md5(text)}`, result);
            }}
            tooltip={t("useAIAssistantToAnalyze")}
          />
        </div>
      )}
    </TabsContent>
  );
}

const AIButton = (props: {
  prompt: string;
  onReply?: (replies: MessageType[]) => void;
  tooltip: string;
}) => {
  const { prompt, onReply, tooltip } = props;
  return (
    <ConversationShortcuts
      prompt={prompt}
      onReply={onReply}
      title={tooltip}
      trigger={
        <Button
          data-tooltip-id="media-shadow-tooltip"
          data-tooltip-content={tooltip}
          variant="outline"
          size="sm"
          className="p-0 w-8 h-8 rounded-full"
        >
          <BotIcon className="w-5 h-5" />
        </Button>
      }
    />
  );
};
