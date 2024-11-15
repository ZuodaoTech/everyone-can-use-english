import { useEffect, useState, useReducer, useContext } from "react";
import {
  AudioCard,
  MediaAddButton,
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
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  DialogDescription,
  AlertDialogTrigger,
} from "@renderer/components/ui";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LayoutGridIcon, LayoutListIcon } from "lucide-react";
import { audiosReducer } from "@renderer/reducers";
import { useDebounce } from "@uidotdev/usehooks";
import { LANGUAGES } from "@/constants";

export const AudiosComponent = () => {
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [audios, dispatchAudios] = useReducer(audiosReducer, []);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | null>("all");
  const [orderBy, setOrderBy] = useState<string | null>("updatedAtDesc");
  const debouncedQuery = useDebounce(query, 500);

  const [editing, setEditing] = useState<Partial<AudioType> | null>(null);
  const [deleting, setDeleting] = useState<Partial<AudioType> | null>(null);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("grid");

  useEffect(() => {
    addDblistener(onAudiosUpdate);

    return () => {
      removeDbListener(onAudiosUpdate);
    };
  }, []);

  useEffect(() => {
    EnjoyApp.cacheObjects.get("audios-page-tab").then((value) => {
      if (value) {
        setTab(value);
      }
    });
  }, []);

  useEffect(() => {
    EnjoyApp.cacheObjects.set("audios-page-tab", tab);
  }, [tab]);

  const fetchAudios = async (options?: { offset: number }) => {
    if (loading) return;
    const { offset = audios.length } = options || {};

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

    EnjoyApp.audios
      .findAll({
        offset,
        limit,
        order,
        where,
        query: debouncedQuery,
      })
      .then((_audios) => {
        setHasMore(_audios.length >= limit);

        if (offset === 0) {
          dispatchAudios({ type: "set", records: _audios });
        } else {
          dispatchAudios({ type: "append", records: _audios });
        }
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
      if (action === "destroy") {
        dispatchAudios({ type: "destroy", record });
      } else if (action === "create") {
        dispatchAudios({ type: "create", record });
      } else if (action === "update") {
        dispatchAudios({ type: "update", record });
      }
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

  useEffect(() => {
    fetchAudios({ offset: 0 });
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

            <MediaAddButton type="Audio" />
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
                      EnjoyApp.audios
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

          {audios.length === 0 ? (
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
                <div className="grid gap-4 grid-cols-5">
                  {audios.map((audio) => (
                    <AudioCard
                      audio={audio}
                      key={audio.id}
                      onEdit={() => setEditing(audio)}
                      onDelete={() => setDeleting(audio)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list">
                <AudiosTable
                  audios={audios}
                  onEdit={(audio) => setEditing(audio)}
                  onDelete={(audio) => setDeleting(audio)}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {!loading && hasMore && (
        <div className="flex items-center justify-center my-4">
          <Button variant="link" onClick={() => fetchAudios()}>
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
            <DialogDescription className="sr-only">
              edit audio
            </DialogDescription>
          </DialogHeader>

          <AudioEditForm
            audio={editing}
            onCancel={() => setEditing(null)}
            onFinish={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => {
          if (value) return;
          setDeleting(null);
        }}
      >
        <AlertDialogContent>
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
                EnjoyApp.audios
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
