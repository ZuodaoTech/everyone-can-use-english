import { t } from "i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
  PingPoint,
} from "@renderer/components/ui";
import {
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  AudioWaveformIcon,
} from "lucide-react";
import dayjs from "@renderer/lib/dayjs";
import { secondsToTimestamp } from "@renderer/lib/utils";
import { Link } from "react-router-dom";

export const VideosTable = (props: {
  videos: Partial<VideoType>[];
  onEdit: (video: Partial<VideoType>) => void;
  onDelete: (video: Partial<VideoType>) => void;
  onTranscribe: (video: Partial<VideoType>) => void;
}) => {
  const { videos, onEdit, onDelete, onTranscribe } = props;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="capitalize">{t("models.video.name")}</TableHead>
          <TableHead className="capitalize">
            {t("models.video.duration")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.video.recordingsCount")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.video.recordingsDuration")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.video.createdAt")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.video.isTranscribed")}
          </TableHead>
          <TableHead className="capitalize">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => (
          <TableRow key={video.id}>
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Link to={`/videos/${video.id}`}>
                      <div className="cursor-pointer truncate max-w-[12rem]">
                        {video.name}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="p-2">
                      <p className="text-sm">{video.name}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            <TableCell>
              {video.duration ? secondsToTimestamp(video.duration) : "-"}
            </TableCell>
            <TableCell>{video.recordingsCount}</TableCell>
            <TableCell>
              {secondsToTimestamp(video.recordingsDuration / 1000)}
            </TableCell>
            <TableCell>
              {dayjs(video.createdAt).format("YYYY-MM-DD HH:mm")}
            </TableCell>
            <TableCell>
              {video.transcribing ? (
                <PingPoint colorClassName="bg-yellow-500" />
              ) : video.transcribed ? (
                <CheckCircleIcon className="text-green-500 w-4 h-4" />
              ) : (
                <PingPoint colorClassName="bg-gray-500" />
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <Button
                  title={t("transcribe")}
                  variant="ghost"
                  onClick={() => onTranscribe(Object.assign({}, video))}
                >
                  <AudioWaveformIcon className="h-4 w-4" />
                </Button>
                <Button
                  title={t("edit")}
                  variant="ghost"
                  onClick={() => onEdit(Object.assign({}, video))}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  title={t("delete")}
                  variant="ghost"
                  onClick={() => onDelete(Object.assign({}, video))}
                >
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
