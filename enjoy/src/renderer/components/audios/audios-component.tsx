import { useEffect, useState, useReducer, useContext } from "react";
import {
  AudioCard,
  AddMediaButton,
  AudiosTable,
  AudioEditForm,
  LoaderSpin,
} from "@renderer/components";
import { t } from "i18next";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  AlertDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@renderer/components/ui";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LayoutGridIcon, LayoutListIcon } from "lucide-react";
import { audiosReducer } from "@renderer/reducers";
import { useNavigate } from "react-router-dom";
import { useTranscribe } from "@renderer/hooks";

export const AudiosComponent = () => {
  const [audios, dispatchAudios] = useReducer(audiosReducer, []);

  const [editing, setEditing] = useState<Partial<AudioType> | null>(null);
  const [deleting, setDeleting] = useState<Partial<AudioType> | null>(null);
  const [transcribing, setTranscribing] = useState<Partial<AudioType> | null>(
    null
  );
  const { transcribe } = useTranscribe();

  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [offset, setOffest] = useState(0);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    addDblistener(onAudiosUpdate);
    fetchAudios();

    return () => {
      removeDbListener(onAudiosUpdate);
    };
  }, []);

  const fetchAudios = async () => {
    if (loading) return;
    if (offset === -1) return;

    setLoading(true);
    const limit = 10;
    EnjoyApp.audios
      .findAll({
        offset,
        limit,
      })
      .then((_audios) => {
        if (_audios.length === 0) {
          setOffest(-1);
          return;
        }

        if (_audios.length < limit) {
          setOffest(-1);
        } else {
          setOffest(offset + _audios.length);
        }

        dispatchAudios({ type: "append", records: _audios });
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onAudiosUpdate = (event: CustomEvent) => {
    const { record, action, model } = event.detail || {};
    if (!record) return;

    if (model === "Audio") {
      if (action === "create") {
        dispatchAudios({ type: "create", record });
        navigate(`/audios/${record.id}`);
      } else if (action === "destroy") {
        dispatchAudios({ type: "destroy", record });
      }
    } else if (model === "Video" && action === "create") {
      navigate(`/videos/${record.id}`);
    } else if (model === "Transcription" && action === "update") {
      dispatchAudios({
        type: "update",
        record: {
          id: record.targetId,
          transcribing: record.state === "processing",
          transcribed: record.state === "finished",
        },
      });
    }
  };

  if (audios.length === 0) {
    if (loading) return <LoaderSpin />;

    return (
      <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
        <AddMediaButton />
      </div>
    );
  }

  return (
    <>
      <div className="">
        <Tabs defaultValue="grid">
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-4">
              <TabsList>
                <TabsTrigger value="grid">
                  <LayoutGridIcon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <LayoutListIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </div>
            <AddMediaButton />
          </div>
          <TabsContent value="grid">
            <div className="grid gap-4 grid-cols-5">
              {audios.map((audio) => (
                <AudioCard audio={audio} key={audio.id} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list">
            <AudiosTable
              audios={audios}
              onEdit={(audio) => setEditing(audio)}
              onDelete={(audio) => setDeleting(audio)}
              onTranscribe={(audio) => setTranscribing(audio)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {offset > -1 && (
        <div className="flex items-center justify-center my-4">
          <Button variant="link" onClick={fetchAudios}>
            {t("loadMore")}
          </Button>
        </div>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(value) => {
          if (value) return;
          setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editResource")}</DialogTitle>
          </DialogHeader>

          <AudioEditForm
            audio={editing}
            onCancel={() => setEditing(null)}
            onFinish={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(value) => {
          if (value) return;
          setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteResource")}</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="break-all">
                {t("deleteResourceConfirmation", {
                  name: deleting?.name || "",
                })}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={async () => {
                if (!deleting) return;
                await EnjoyApp.audios.destroy(deleting.id);
                setDeleting(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!transcribing}
        onOpenChange={(value) => {
          if (value) return;
          setTranscribing(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="break-all">
                {t("transcribeAudioConfirmation", {
                  name: transcribing?.name || "",
                })}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={async () => {
                if (!transcribing) return;

                transcribe(transcribing.src, {
                  targetId: transcribing.id,
                  targetType: "Audio",
                }).finally(() => {
                  setTranscribing(null);
                });
              }}
            >
              {t("transcribe")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
