import { Link } from "react-router-dom";
import { cn } from "@renderer/lib/utils";
import {
  CircleAlertIcon,
  VideoIcon,
  MoreVerticalIcon,
  TrashIcon,
  EditIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { t } from "i18next";

export const VideoCard = (props: {
  video: Partial<VideoType>;
  className?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}) => {
  const { video, className, onDelete, onEdit } = props;

  return (
    <div className={cn("w-full relative", className)}>
      <Link to={`/videos/${video.id}`}>
        <div
          className="aspect-[4/3] border rounded-lg overflow-hidden relative"
          style={{
            borderBottomColor: `#${video.md5.substr(0, 6)}`,
            borderBottomWidth: 3,
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <VideoIcon className="w-12 h-12" />
            <img
              src={video.coverUrl}
              crossOrigin="anonymous"
              className="absolute top-0 left-0 hover:scale-105 object-cover w-full h-full bg-cover bg-center"
            />
          </div>
          {video.language && (
            <Badge className="absolute left-2 top-2">{video.language}</Badge>
          )}
          {!video.src && (
            <div
              data-tooltip-content={t("cannotFindSourceFile")}
              data-tooltip-id="global-tooltip"
              className="absolute right-2 top-2"
            >
              <CircleAlertIcon className="text-destructive w-4 h-4" />
            </div>
          )}
        </div>
      </Link>
      <div className="text-sm font-semibold mt-2 max-w-full truncate">
        {video.name}
      </div>
      {(onDelete || onEdit) && (
        <div className="absolute right-1 top-1 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-transparent w-6 h-6"
              >
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="size-4" />
                  <span className="ml-2 text-sm">{t("edit")}</span>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete}>
                  <TrashIcon className="size-4 text-destructive" />
                  <span className="ml-2 text-destructive text-sm">
                    {t("delete")}
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
