import { useEffect, useState, useReducer, useContext } from "react";
import {
  VideoCard,
  VideosTable,
  VideoEditForm,
  AddMediaButton,
  LoaderSpin,
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
  Button,
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
import { videosReducer } from "@renderer/reducers";

export const VideosComponent = () => {
  const [videos, dispatchVideos] = useReducer(videosReducer, []);

  const [editing, setEditing] = useState<Partial<VideoType> | null>(null);
  const [deleting, setDeleting] = useState<Partial<VideoType> | null>(null);

  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [offset, setOffest] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    addDblistener(onVideosUpdate);
    fetchVideos();

    return () => {
      removeDbListener(onVideosUpdate);
    };
  }, []);

  const fetchVideos = async () => {
    if (loading) return;
    if (offset === -1) return;

    setLoading(true);
    const limit = 10;
    EnjoyApp.videos
      .findAll({
        offset,
        limit,
      })
      .then((_videos) => {
        if (_videos.length === 0) {
          setOffest(-1);
          return;
        }

        if (_videos.length < limit) {
          setOffest(-1);
        } else {
          setOffest(offset + _videos.length);
        }

        dispatchVideos({ type: "append", records: _videos });
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onVideosUpdate = (event: CustomEvent) => {
    const { record, action, model } = event.detail || {};
    if (!record) return;

    if (model === "Video") {
      if (action === "create") {
        dispatchVideos({ type: "create", record });
      } else if (action === "update") {
        dispatchVideos({ type: "update", record });
      } else if (action === "destroy") {
        dispatchVideos({ type: "destroy", record });
      }
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
    if (loading) return <LoaderSpin />;

    return (
      <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
        <AddMediaButton type="Video" />
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
            <AddMediaButton type="Video" />
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
            />
          </TabsContent>
        </Tabs>
      </div>

      {offset > -1 && (
        <div className="flex items-center justify-center my-4">
          <Button variant="link" onClick={fetchVideos}>
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
                await EnjoyApp.videos.destroy(deleting.id);
                setDeleting(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
