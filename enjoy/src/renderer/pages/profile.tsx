import { useEffect, useState, useContext } from "react";
import {
  RecordingStats,
  RecordingCalendar,
  RecordingActivities,
} from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "@renderer/lib/dayjs";
import { t } from "i18next";

export default () => {
  const navigate = useNavigate();

  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [range, setRange] = useState<[string, string]>([
    dayjs().subtract(7, "day").format(),
    dayjs().format(),
  ]);

  useEffect(() => {
    EnjoyApp.recordings.syncAll();
  }, []);

  return (
    <div className="h-full px-4 py-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex space-x-1 items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("sidebar.profile")}</span>
        </div>

        <div className="mb-8">
          <RecordingStats />
        </div>

        <div className="mb-8">
          <RecordingCalendar
            onSelectRange={(from, to) => {
              setRange([from, to]);
            }}
          />
        </div>

        <div className="">
          <RecordingActivities from={range[0]} to={range[1]} />
        </div>
      </div>
    </div>
  );
};
