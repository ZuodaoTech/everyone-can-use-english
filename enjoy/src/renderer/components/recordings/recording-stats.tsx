import { useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { secondsToTimestamp } from "@renderer/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@renderer/components/ui";
import { t } from "i18next";
import dayjs from "@renderer/lib/dayjs";

export const RecordingStats = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <RecordingStatsCard
        label={t("today")}
        from={dayjs().startOf("day").format()}
        to={dayjs().endOf("day").format()}
      />
      <RecordingStatsCard
        label={t("yesterday")}
        from={dayjs().subtract(1, "day").startOf("day").format()}
        to={dayjs().subtract(1, "day").endOf("day").format()}
      />
      <RecordingStatsCard label={t("total")} />
    </div>
  );
};

export const RecordingStatsCard = (props: {
  label: string;
  from?: string;
  to?: string;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { label, from, to } = props;
  const [stats, setStats] = useState<{
    count: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    EnjoyApp.recordings.stats({ from, to }).then((_stats) => {
      setStats(_stats);
    });
  }, []);

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          {label}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-2">
          <span className="text-2xl font-bold">{stats.count}</span>
          <span className="text-sm text-muted-foreground">
            {t("totalRecordings", { total: "" })}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("totalDuration", {
            duration: secondsToTimestamp(stats.duration / 1000),
          })}
        </div>
      </CardContent>
    </Card>
  );
};
