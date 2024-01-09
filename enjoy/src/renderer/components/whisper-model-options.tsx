import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ScrollArea,
  useToast,
  Progress,
} from "@renderer/components/ui";
import { t } from "i18next";
import { InfoIcon, CheckCircle, DownloadIcon } from "lucide-react";
import { WHISPER_MODELS_OPTIONS } from "@/constants";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

type ModelType = {
  type: string;
  name: string;
  size: string;
  url: string;
  downloaded?: boolean;
  downloadState?: DownloadStateType;
};

export const WhisperModelOptionsPanel = () => {
  const { whisperModelsPath } = useContext(AppSettingsProviderContext);

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("sttAiModel")}</CardTitle>
          <CardDescription>
            {t("chooseAIModelDependingOnYourHardware")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <WhisperModelOptions />
        </CardContent>

        <CardFooter>
          <div className="text-xs opacity-70 flex items-start">
            <InfoIcon className="mr-1.5 w-4 h-4" />
            <span className="flex-1">
              {t("yourModelsWillBeDownloadedTo", {
                path: whisperModelsPath,
              })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export const WhisperModelOptions = () => {
  const [selectingModel, setSelectingModel] = useState<ModelType | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelType[]>([]);
  const { whisperModelsPath, whisperModel, setWhisperModel, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );
  const { toast } = useToast();

  useEffect(() => {
    updateAvailableModels();

    return EnjoyApp.download.removeAllListeners();
  }, [whisperModelsPath]);

  const updateAvailableModels = async () => {
    const models = await EnjoyApp.whisper.availableModels();
    const options: ModelType[] = WHISPER_MODELS_OPTIONS;
    options.forEach((o) => {
      o.downloaded = models.findIndex((m) => m === o.name) > -1;
    });
    setAvailableModels(options);
  };

  const downloadModel = async () => {
    if (!selectingModel) return;

    EnjoyApp.whisper.downloadModel(selectingModel.name);
    listenToDownloadState();

    setSelectingModel(null);
  };

  const listenToDownloadState = () => {
    EnjoyApp.download.onState((_event, state) => {
      const model = availableModels.find((m) => m.name === state.name);
      if (model) {
        model.downloadState = state;
      }
      if (state.state === "completed") {
        model.downloaded = true;
        EnjoyApp.download.removeAllListeners();
      }

      setAvailableModels([...availableModels]);
    });
  };

  return (
    <>
      <ScrollArea className="max-h-96">
        {availableModels.map((option) => {
          return (
            <div
              key={option.name}
              className={`cursor-pointer hover:bg-secondary px-4 py-2 rounded ${
                whisperModel === option.name ? "bg-secondary" : ""
              }`}
              onClick={() => {
                if (option.downloaded) {
                  setWhisperModel(option.name);
                } else if (option.downloadState) {
                  toast({
                    title: "Downloading",
                    description: `${option.name} is downloading...`,
                  });
                } else {
                  setSelectingModel(option);
                }
              }}
            >
              <div className="flex justify-between">
                <div className="font-semibold">{option.type}</div>
                {option.downloaded ? (
                  <CheckCircle
                    className={`w-4 ${
                      whisperModel === option.name ? "text-green-500" : ""
                    }`}
                  />
                ) : (
                  <DownloadIcon className="w-4 opacity-70" />
                )}
              </div>
              <div className="text-sm opacity-70 flex justify-between">
                <span>{option.name}</span>
                <span>~{option.size}</span>
              </div>
              {!option.downloaded && option.downloadState && (
                <div className="py-2">
                  <Progress
                    className="h-1"
                    value={
                      (option.downloadState.received /
                        option.downloadState.total) *
                      100
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </ScrollArea>

      <AlertDialog open={!!selectingModel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("download")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToDownload", {
                name: `${selectingModel?.name}(${selectingModel?.size})`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectingModel(null);
              }}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => downloadModel()}>
              {t("download")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
