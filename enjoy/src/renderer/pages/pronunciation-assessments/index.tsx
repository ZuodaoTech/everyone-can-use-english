import { useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  toast,
} from "@renderer/components/ui";
import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import {
  PronunciationAssessmentCard,
  RecordingDetail,
} from "@renderer/components";

export default () => {
  const navigate = useNavigate();
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const [assessments, setAssessments] = useState<PronunciationAssessmentType[]>(
    []
  );
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [orderBy, setOrderBy] = useState<string>("createdAtDesc");
  const [selecting, setSelecting] =
    useState<PronunciationAssessmentType | null>(null);
  const [deleting, setDeleting] = useState<PronunciationAssessmentType | null>(
    null
  );
  const [sharing, setSharing] = useState<RecordingType | null>(null);

  const handleDelete = async (assessment: PronunciationAssessmentType) => {
    try {
      await EnjoyApp.pronunciationAssessments.destroy(assessment.id);
      setAssessments(assessments.filter((a) => a.id !== assessment.id));
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleShare = async () => {
    if (!sharing) return;

    if (!sharing.isSynced) {
      try {
        await EnjoyApp.recordings.sync(sharing.id);
      } catch (error) {
        toast.error(t("shareFailed"), { description: error.message });
        return;
      }
    }
    if (!sharing.uploadedAt) {
      try {
        await EnjoyApp.recordings.upload(sharing.id);
      } catch (error) {
        toast.error(t("shareFailed"), { description: error.message });
        return;
      }
    }

    webApi
      .createPost({
        targetId: sharing.id,
        targetType: "Recording",
      })
      .then(() => {
        toast.success(t("sharedSuccessfully"), {
          description: t("sharedRecording"),
        });
      })
      .catch((error) => {
        toast.error(t("shareFailed"), {
          description: error.message,
        });
      });
  };

  const fetchAssessments = (params?: { offset: number; limit?: number }) => {
    const { offset = 0, limit = 10 } = params || {};
    if (offset > 0 && !hasMore) return;

    let order = ["createdAt", "DESC"];
    switch (orderBy) {
      case "createdAtDesc":
        order = ["createdAt", "DESC"];
        break;
      case "createdAtAsc":
        order = ["createdAt", "ASC"];
        break;
      case "scoreDesc":
        order = ["pronunciationScore", "DESC"];
        break;
      case "scoreAsc":
        order = ["pronunciationScore", "ASC"];
        break;
    }

    EnjoyApp.pronunciationAssessments
      .findAll({
        limit,
        offset,
        order: [order],
      })
      .then((fetchedAssessments) => {
        if (offset === 0) {
          setAssessments(fetchedAssessments);
        } else {
          setAssessments([...assessments, ...fetchedAssessments]);
        }
        setHasMore(fetchedAssessments.length === limit);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    fetchAssessments();
  }, [orderBy]);

  return (
    <>
      <div className="min-h-full px-4 py-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="">
            <div className="flex items-center gap-2">
              <Label className="min-w-max">{t("sortBy")}:</Label>
              <Select value={orderBy} onValueChange={setOrderBy}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_sort_order")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="createdAtDesc">
                      {t("createdAtDesc")}
                    </SelectItem>
                    <SelectItem value="createdAtAsc">
                      {t("createdAtAsc")}
                    </SelectItem>
                    <SelectItem value="scoreDesc">{t("scoreDesc")}</SelectItem>
                    <SelectItem value="scoreAsc">{t("scoreAsc")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => navigate("/pronunciation_assessments/new")}>
            {t("newAssessment")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          {assessments.map((assessment) => (
            <PronunciationAssessmentCard
              key={assessment.id}
              pronunciationAssessment={assessment}
              onSelect={setSelecting}
              onDelete={setDeleting}
              onSharing={setSharing}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={() => fetchAssessments({ offset: assessments.length })}
            >
              {t("loadMore")}
            </Button>
          </div>
        )}
      </div>

      <Sheet
        open={Boolean(selecting)}
        onOpenChange={(value) => {
          if (!value) setSelecting(null);
        }}
      >
        <SheetContent
          aria-describedby={undefined}
          side="bottom"
          className="rounded-t-2xl shadow-lg max-h-content overflow-y-scroll"
          displayClose={false}
        >
          <SheetHeader className="flex items-center justify-center -mt-4 mb-2">
            <SheetTitle className="sr-only">Assessment</SheetTitle>
            <SheetClose>
              <ChevronDownIcon />
            </SheetClose>
          </SheetHeader>
          {selecting && (
            <RecordingDetail
              recording={selecting.target}
              pronunciationAssessment={selecting}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => {
          if (!value) setDeleting(null);
        }}
      >
        <AlertDialogContent aria-describedby={undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToDeleteThisAssessment")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleting)}>
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(sharing)}
        onOpenChange={(value) => {
          if (!value) setSharing(null);
        }}
      >
        <AlertDialogContent aria-describedby={undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shareRecording")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToShareThisRecordingToCommunity")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleShare}>{t("share")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
