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
  CircleAlertIcon,
} from "lucide-react";
import { formatDateTime, secondsToTimestamp } from "@renderer/lib/utils";
import { Link } from "react-router-dom";

export const VideosTable = (props: {
  videos: Partial<VideoType>[];
  onEdit: (video: Partial<VideoType>) => void;
  onDelete: (video: Partial<VideoType>) => void;
}) => {
  const { videos, onEdit, onDelete } = props;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="capitalize">{t("models.video.name")}</TableHead>
          <TableHead className="capitalize">{t("language")}</TableHead>
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
            {t("models.video.updatedAt")}
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
                      <div className="flex items-center space-x-2">
                        {!video.src && (
                          <CircleAlertIcon
                            data-tooltip-content={t("cannotFindSourceFile")}
                            data-tooltip-id="global-tooltip"
                            className="text-destructive w-4 h-4"
                          />
                        )}
                        <div className="cursor-pointer truncate max-w-[12rem]">
                          {video.name}
                        </div>
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
            <TableCell>{video.language ? video.language : "-"}</TableCell>
            <TableCell>
              {video.duration ? secondsToTimestamp(video.duration) : "-"}
            </TableCell>
            <TableCell>{video.recordingsCount}</TableCell>
            <TableCell>
              {secondsToTimestamp(video.recordingsDuration / 1000)}
            </TableCell>
            <TableCell>{formatDateTime(video.updatedAt)}</TableCell>
            <TableCell>
              {video.transcribed ? (
                <CheckCircleIcon className="text-green-500 w-4 h-4" />
              ) : (
                <PingPoint colorClassName="bg-gray-500" className="w-2 h-2" />
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center">
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
