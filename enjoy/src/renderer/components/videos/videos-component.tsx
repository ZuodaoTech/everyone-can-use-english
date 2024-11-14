import { useEffect, useState, useReducer, useContext } from "react";
import {
  VideoCard,
  VideosTable,
  VideoEditForm,
  MediaAddButton,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  toast,
  Input,
  DialogDescription,
  AlertDialogTrigger,
} from "@renderer/components/ui";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LayoutGridIcon, LayoutListIcon } from "lucide-react";
import { videosReducer } from "@renderer/reducers";
import { useDebounce } from "@uidotdev/usehooks";
import { LANGUAGES } from "@/constants";

export const VideosComponent = () => {
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [videos, dispatchVideos] = useReducer(videosReducer, []);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | null>("all");
  const [orderBy, setOrderBy] = useState<string | null>("updatedAtDesc");
  const debouncedQuery = useDebounce(query, 500);

  const [editing, setEditing] = useState<Partial<VideoType> | null>(null);
  const [deleting, setDeleting] = useState<Partial<VideoType> | null>(null);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("grid");

  useEffect(() => {
    addDblistener(onVideosUpdate);

    return () => {
      removeDbListener(onVideosUpdate);
    };
  }, []);

  useEffect(() => {
    EnjoyApp.cacheObjects.get("videos-page-tab").then((value) => {
      if (value) {
        setTab(value);
      }
    });
  }, []);

  useEffect(() => {
    EnjoyApp.cacheObjects.set("videos-page-tab", tab);
  }, [tab]);

  const fetchVideos = async (options?: { offset: number }) => {
    if (loading) return;
    const { offset = videos.length } = options || {};

    setLoading(true);
    const limit = 20;

    let order = [];
    switch (orderBy) {
      case "updatedAtDesc":
        order = [["updatedAt", "DESC"]];
        break;
      case "createdAtDesc":
        order = [["createdAt", "DESC"]];
        break;
      case "createdAtAsc":
        order = [["createdAt", "ASC"]];
        break;
      case "recordingsDurationDesc":
        order = [["recordingsDuration", "DESC"]];
        break;
      case "recordingsCountDesc":
        order = [["recordingsCount", "DESC"]];
        break;
      default:
        order = [["updatedAt", "DESC"]];
    }
    let where = {};
    if (language != "all") {
      where = { language };
    }
    EnjoyApp.videos
      .findAll({
        offset,
        limit,
        order,
        where,
        query: debouncedQuery,
      })
      .then((_videos) => {
        setHasMore(_videos.length >= limit);

        if (offset === 0) {
          dispatchVideos({ type: "set", records: _videos });
        } else {
          dispatchVideos({ type: "append", records: _videos });
        }
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

  useEffect(() => {
    fetchVideos({ offset: 0 });
  }, [debouncedQuery, language, orderBy]);

  return (
    <>
      <div className="">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGridIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <LayoutListIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger className="max-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="updatedAtDesc">
                    {t("updatedAtDesc")}
                  </SelectItem>
                  <SelectItem value="createdAtDesc">
                    {t("createdAtDesc")}
                  </SelectItem>
                  <SelectItem value="createdAtAsc">
                    {t("createdAtAsc")}
                  </SelectItem>
                  <SelectItem value="recordingsDurationDesc">
                    {t("recordingsDurationDesc")}
                  </SelectItem>
                  <SelectItem value="recordingsCountDesc">
                    {t("recordingsCountDesc")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="max-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("allLanguages")}</SelectItem>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Input
              className="max-w-48"
              placeholder={t("search")}
              onChange={(e) => setQuery(e.target.value)}
            />
            <MediaAddButton type="Video" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">{t("cleanUp")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>{t("cleanUp")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("cleanUpConfirmation")}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      EnjoyApp.videos
                        .cleanUp()
                        .then(() => toast.success(t("cleanedUpSuccessfully")))
                    }
                  >
                    {t("confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {videos.length === 0 ? (
            loading ? (
              <LoaderSpin />
            ) : (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
                {t("noData")}
              </div>
            )
          ) : (
            <>
              <TabsContent value="grid">
                <div className="grid gap-4 grid-cols-4">
                  {videos.map((video) => (
                    <VideoCard
                      video={video}
                      key={video.id}
                      onDelete={() => setDeleting(video)}
                    />
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
            </>
          )}
        </Tabs>
      </div>

      {!loading && hasMore && (
        <div className="flex items-center justify-center my-4">
          <Button variant="link" onClick={() => fetchVideos()}>
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
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("editResource")}</DialogTitle>
            <DialogDescription className="sr-only">
              edit video
            </DialogDescription>
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
        <AlertDialogContent aria-describedby={undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteResource")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="break-all">
                {t("deleteResourceConfirmation", {
                  name: deleting?.name || "",
                })}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={() => {
                if (!deleting) return;
                EnjoyApp.videos
                  .destroy(deleting.id)
                  .catch((err) => toast.error(err.message))
                  .finally(() => setDeleting(null));
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
