import { useState, useContext } from "react";
import { AppSettingsProviderContext } from "@/renderer/context";
import {
  RecordingPlayer,
  PronunciationAssessmentScoreIcon,
} from "@renderer/components";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { MoreHorizontalIcon, Trash2Icon, InfoIcon } from "lucide-react";
import { formatDateTime , secondsToTimestamp } from "@renderer/lib/utils";
import { useLongPress } from "@uidotdev/usehooks";
import { t } from "i18next";

export const RecordingCard = (props: {
  recording: RecordingType;
  id?: string;
  onSelect?: () => void;
}) => {
  const { recording, id, onSelect } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [isPlaying, setIsPlaying] = useState(false);

  const longPressAttrs = useLongPress(
    () => {
      setIsMenuOpen(true);
    },
    {
      onFinish: () => {},
      onCancel: () => {},
      threshold: 400,
    }
  );

  const handleDelete = () => {
    EnjoyApp.recordings.destroy(recording.id);
  };

  return (
    <div
      id={id}
      className={`flex items-center justify-end p-4 transition-all ${
        isMenuOpen ? "bg-sky-500/20" : ""
      }`}
    >
      <DropdownMenu
        open={isMenuOpen}
        onOpenChange={(value) => setIsMenuOpen(value)}
      >
        <div {...longPressAttrs} className="w-full">
          <div className="flex items-center space-x-2 justify-start px-2 mb-1">
            <DropdownMenuTrigger>
              <MoreHorizontalIcon className="w-4 h-4 text-muted-foreground hidden" />
            </DropdownMenuTrigger>
          </div>

          <div className="bg-white rounded-lg py-2 px-4 mb-2 relative">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-xs text-muted-foreground">
                {secondsToTimestamp(recording.duration / 1000)}
              </span>
            </div>

            <RecordingPlayer
              recording={recording}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />

            <div className="flex items-center justify-between space-x-2">
              <Button
                onClick={onSelect}
                variant="ghost"
                size="sm"
                className="p-1 h-6"
              >
                <InfoIcon
                  className={`w-4 h-4
                    ${
                      recording.pronunciationAssessment
                        ? recording.pronunciationAssessment
                            .pronunciationScore >= 80
                          ? "text-green-500"
                          : recording.pronunciationAssessment
                              .pronunciationScore >= 60
                          ? "text-yellow-600"
                          : "text-red-500"
                        : "text-muted-foreground"
                    }
                    `}
                />
              </Button>

              <span className="text-xs text-muted-foreground">
                {formatDateTime(recording.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSelect}>
            <span className="mr-auto capitalize">{t("detail")}</span>
            <InfoIcon className="w-4 h-4" />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
            <span className="mr-auto text-destructive capitalize">
              {t("delete")}
            </span>
            <Trash2Icon className="w-4 h-4 text-destructive" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(value) => setIsDeleteDialogOpen(value)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecording")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecordingConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
