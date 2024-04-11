import { useCallback, useState, useEffect, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { formatDate, secondsToTimestamp } from "@renderer/lib/utils";
import { t } from "i18next";
import { Link } from "react-router-dom";
import { LoaderIcon, AudioLinesIcon } from "lucide-react";

export const RecordingActivities = (props: { from: string; to: string }) => {
  const { from, to } = props;
  const [loading, setLoading] = useState(true);
  const [activities, setActitivies] = useState<
    {
      date: string;
      targetId: string;
      targetType: string;
      count: number;
      duration: number;
      target: AudioType | VideoType;
    }[]
  >([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    EnjoyApp.recordings
      .groupByTarget({
        from,
        to,
      })
      .then((_activities) => {
        setActitivies(_activities || []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [from, to]);

  useEffect(() => {
    fetchRecordings();
  }, [from, to]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoaderIcon className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl mb-4">{t("recordingActivity")}</h2>
      {activities.length === 0 ? (
        <>
          <div className="pt-2 pb-4 capitalize text-sm font-bold">
            {formatDate(from)}
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("noRecordingActivities")}
          </div>
        </>
      ) : (
        activities.map((activity, index) => {
          return (
            <Activity
              key={index}
              activity={activity}
              displayDate={
                index === 0 || activity.date !== activities[index - 1].date
              }
            />
          );
        })
      )}
    </>
  );
};

const Activity = (props: {
  displayDate: boolean;
  activity: {
    date: string;
    count: number;
    duration: number;
    target: AudioType | VideoType;
    targetId: string;
    targetType: string;
  };
}) => {
  const { activity, displayDate } = props;

  if (!activity.target) {
    return null;
  }

  return (
    <>
      {displayDate && (
        <div className="pt-2 pb-4 capitalize text-sm font-bold">
          {formatDate(activity.date)}
        </div>
      )}
      <div className="flex items-center space-x-2 mb-4">
        {activity.targetType === "Audio" && (
          <AudioLinesIcon className="w-4 h-4" />
        )}

        {activity.targetType === "Audio" && (
          <Link
            to={`/audios/${activity.targetId}`}
            className="max-w-[18rem] truncate text-blue-700"
          >
            {(activity.target as AudioType).name}
          </Link>
        )}

        {activity.targetType === "Video" && (
          <Link
            to={`/videos/${activity.targetId}`}
            className="max-w-[18rem] truncate text-blue-700"
          >
            {(activity.target as AudioType).name}
          </Link>
        )}
        {" ,"}
        <span className="">
          {t("totalRecordings", { total: activity.count })}
        </span>
        {" ,"}
        <span className="">
          {t("totalDuration", {
            duration: secondsToTimestamp(activity.duration / 1000),
          })}
        </span>
      </div>
    </>
  );
};
