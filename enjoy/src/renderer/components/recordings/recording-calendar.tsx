import React, { useEffect, useState, useContext, useCallback } from "react";
import Calendar, {
  Activity,
  Skeleton,
  ThemeInput,
} from "react-activity-calendar";
import { AppSettingsProviderContext, useTheme } from "@renderer/context";
import { ScrollArea, Button } from "@renderer/components/ui";
import { t } from "i18next";
import dayjs from "@renderer/lib/dayjs";
import { Dayjs } from "dayjs";
import { Tooltip } from "react-tooltip";

const DEFAULT_THEME: ThemeInput = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

export const RecordingCalendar = (props: {
  onSelectRange?: (from: string, to: string) => void;
}) => {
  const { onSelectRange } = props;
  const { colorScheme } = useTheme();

  const [tab, setTab] = useState<string | number>("lastYear");
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, "year").add(1, "day"),
    dayjs(),
  ]);
  const { user, EnjoyApp } = useContext(AppSettingsProviderContext);

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Activity | null>(null);

  const tabs = useCallback(() => {
    const currentYear = dayjs().year();
    const _tabs = [
      {
        label: t("lastYear"),
        value: "lastYear",
      },
      {
        label: currentYear,
        value: currentYear,
      },
    ];
    const startYear = dayjs(user?.createdAt).year();

    for (let i = currentYear - 1; i >= startYear; i--) {
      _tabs.push({
        label: i,
        value: i,
      });
    }

    return _tabs;
  }, []);

  const handleTabChange = useCallback((tab: string | number) => {
    if (tab === "lastYear") {
      const startDate = dayjs().subtract(1, "year").add(1, "day");
      const endDate = dayjs();
      setRange([startDate, endDate]);
      onSelectRange && onSelectRange(startDate.format(), endDate.format());
    } else if (typeof tab === "number") {
      const startDate = dayjs().year(tab).startOf("year");
      const endDate = dayjs().year(tab).endOf("year");
      setRange([startDate, endDate]);
      onSelectRange && onSelectRange(startDate.format(), endDate.format());
    }

    setTab(tab);
  }, []);

  useEffect(() => {
    fetchRecordingStats();
  }, [range]);

  const fetchRecordingStats = () => {
    EnjoyApp.recordings
      .groupByDate({
        from: range[0].format(),
        to: range[1].format(),
      })
      .then((_stats) => {
        const startDate = range[0].format("YYYY-MM-DD");
        const endDate = range[1].format("YYYY-MM-DD");

        if (_stats[0]?.date !== startDate) {
          _stats.unshift({ date: startDate, count: 0, level: 0 });
        }
        if (_stats[_stats.length - 1]?.date !== endDate) {
          _stats.push({ date: endDate, count: 0, level: 0 });
        }

        _stats.forEach((a) => {
          if (a.count === 0) {
            a.level = 0;
          } else if (a.count >= 40) {
            a.level = 4;
          } else {
            a.level = Math.floor(a.count / 10) + 1;
          }
        });

        setStats(_stats);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading || !stats) {
    return <Skeleton loading />;
  }

  return (
    <div className="mx-auto p-4 rounded-lg border flex justify-between gap-2">
      <Calendar
        data={stats}
        labels={{
          months: dayjs.months(),
          legend: {
            less: t("less"),
            more: t("more"),
          },
          totalCount: t("totalRecordingsIn", {
            total: stats.reduce((acc, cur) => acc + cur.count, 0),
            duration: tabs().find((_tab) => _tab.value === tab)?.label,
          }),
        }}
        theme={DEFAULT_THEME}
        colorScheme={colorScheme as "light" | "dark"}
        renderBlock={(block, activity) =>
          React.cloneElement(block, {
            ...block.props,
            "data-tooltip-id": "block-tooltip",
            "data-tooltip-content": t("totalRecordingsIn", {
              total: activity.count,
              duration: activity.date,
            }),
            style: {
              ...block.props.style,
              cursor: "pointer",
              opacity: selected
                ? selected.date === activity.date
                  ? 1
                  : 0.5
                : 1,
            },
          } as React.Attributes)
        }
        eventHandlers={{
          onClick: () => (activity) => {
            setSelected(activity);
            onSelectRange &&
              onSelectRange(
                dayjs(activity.date).startOf("day").format(),
                dayjs(activity.date).endOf("day").format()
              );
          },
        }}
      />
      <ScrollArea className="max-w-fit h-36">
        {tabs().map((_tab) => (
          <Button
            key={_tab.value}
            size="sm"
            className="w-full justify-center py-1 px-1 min-w-max text-xs xl:text-sm 2xl:text-md mb-2"
            variant={_tab.value === tab ? "secondary" : "ghost"}
            onClick={() => handleTabChange(_tab.value)}
          >
            {_tab.label}
          </Button>
        ))}
      </ScrollArea>

      <Tooltip id="block-tooltip" />
    </div>
  );
};
