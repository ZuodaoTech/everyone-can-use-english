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

export const AudiosTable = (props: {
  audios: Partial<AudioType>[];
  onEdit: (audio: Partial<AudioType>) => void;
  onDelete: (audio: Partial<AudioType>) => void;
  onTranscribe: (audio: Partial<AudioType>) => void;
}) => {
  const { audios, onEdit, onDelete, onTranscribe } = props;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="capitalize">{t("models.audio.name")}</TableHead>
          <TableHead className="capitalize">
            {t("models.audio.duration")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.audio.recordingsCount")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.audio.recordingsDuration")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.audio.createdAt")}
          </TableHead>
          <TableHead className="capitalize">
            {t("models.audio.isTranscribed")}
          </TableHead>
          <TableHead className="capitalize">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audios.map((audio) => (
          <TableRow key={audio.id}>
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Link to={`/audios/${audio.id}`}>
                      <div className="cursor-pointer truncate max-w-[12rem]">
                        {audio.name}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="p-2">
                      <p className="text-sm">{audio.name}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            <TableCell>
              {audio.duration ? secondsToTimestamp(audio.duration) : "-"}
            </TableCell>
            <TableCell>{audio.recordingsCount}</TableCell>
            <TableCell>
              {secondsToTimestamp(audio.recordingsDuration / 1000)}
            </TableCell>
            <TableCell>
              {dayjs(audio.createdAt).format("YYYY-MM-DD HH:mm")}
            </TableCell>
            <TableCell>
              {audio.transcribing ? (
                <PingPoint colorClassName="bg-yellow-500" />
              ) : audio.transcribed ? (
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
                  onClick={() => onTranscribe(Object.assign({}, audio))}
                >
                  <AudioWaveformIcon className="h-4 w-4" />
                </Button>
                <Button
                  title={t("edit")}
                  variant="ghost"
                  onClick={() => onEdit(Object.assign({}, audio))}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  title={t("delete")}
                  variant="ghost"
                  onClick={() => onDelete(Object.assign({}, audio))}
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
