import { useEffect, useState, useReducer, useContext } from "react";
import {
  VideoCard,
  VideosTable,
  VideoEditForm,
  AddMediaButton,
} from "@renderer/components";
import { t } from "i18next";
import {
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
} from "@renderer/components/ui";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LayoutGridIcon, LayoutListIcon } from "lucide-react";
import { videosReducer } from "@renderer/reducers";
import { useNavigate } from "react-router-dom";

export const VideosComponent = () => {
  const [videos, dispatchVideos] = useReducer(videosReducer, []);

  const [editing, setEditing] = useState<Partial<VideoType> | null>(null);
  const [deleting, setDeleting] = useState<Partial<VideoType> | null>(null);
  const [transcribing, setTranscribing] = useState<Partial<VideoType> | null>(
    null
  );

  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    addDblistener(onVideosUpdate);
    fetchVideos();

    return () => {
      removeDbListener(onVideosUpdate);
    };
  }, []);

  const fetchVideos = async () => {
    const videos = await EnjoyApp.videos.findAll({
      limit: 10,
    });
    if (!videos) return;

    dispatchVideos({ type: "set", records: videos });
  };

  const onVideosUpdate = (event: CustomEvent) => {
    const { record, action, model } = event.detail || {};
    if (!record) return;

    if (model === "Video") {
      if (action === "create") {
        dispatchVideos({ type: "create", record });
        navigate(`/videos/${record.id}`);
      } else if (action === "destroy") {
        dispatchVideos({ type: "destroy", record });
      }
    } else if (model === "Audio" && action === "create") {
      navigate(`/audios/${record.id}`);
    } else if (model === "Transcription" && action === "update") {
      dispatchVideos({
        type: "update",
        record: {
          id: record.targetId,
          transcribing: record.state === "processing",
          transcribed: record.state === "finished",
        },
      });
    }
  };

  if (videos.length === 0) {
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
            <div className="grid gap-4 grid-cols-4">
              {videos.map((video) => (
                <VideoCard video={video} key={video.id} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list">
            <VideosTable
              videos={videos}
              onEdit={(video) => setEditing(video)}
              onDelete={(video) => setDeleting(video)}
              onTranscribe={(video) => setTranscribing(video)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(value) => {
          if (value) return;
          setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editRecourse")}</DialogTitle>
          </DialogHeader>

          <VideoEditForm
            video={editing}
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
            <AlertDialogTitle>{t("deleteRecourse")}</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="break-all">
                {t("deleteRecourseConfirmation", {
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
                await EnjoyApp.videos.destroy(deleting.id);
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
                {t("transcribeVideoConfirmation", {
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
                await EnjoyApp.videos.transcribe(transcribing.id);
                setTranscribing(null);
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
