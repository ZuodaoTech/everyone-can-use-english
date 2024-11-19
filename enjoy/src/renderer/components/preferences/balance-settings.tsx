import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState, useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  toast,
} from "@renderer/components/ui";
import Chart from "chart.js/auto";

export const BalanceSettings = () => {
  const { refreshAccount, user, setDisplayDepositDialog } = useContext(
    AppSettingsProviderContext
  );
  const [displayUsage, setDisplayUsage] = useState<boolean>(false);

  useEffect(() => {
    refreshAccount?.();
  }, []);

  if (!user?.balance) return null;

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("balance")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          ${user.balance}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button
          variant="secondary"
          size="sm"
          className=""
          onClick={() => setDisplayDepositDialog(true)}
        >
          {t("deposit")}
        </Button>

        <Dialog open={displayUsage} onOpenChange={setDisplayUsage}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="">
              {t("usage")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-full overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("usage")}</DialogTitle>
              <DialogDescription className="sr-only">
                Usage rencently
              </DialogDescription>
              {displayUsage && <UsageChart />}
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const UsageChart = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [usages, setUsages] = useState<{ label: string; data: number[] }[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const fetchUsages = () => {
    webApi
      .usages()
      .then((usages) => {
        setUsages(usages);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const renderUsageChart = () => {
    if (!chartRef.current) return;
    if (!usages.length) return;

    // make labels unique and sorted
    const labels = usages
      .map((usage) => Object.keys(usage.data))
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: usages.map((usage) => ({
          label: usage.label,
          data: Object.values(usage.data),
        })),
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  useEffect(() => {
    fetchUsages();
  }, []);

  useEffect(() => {
    renderUsageChart();
  }, [usages, chartRef.current]);

  return (
    <div className="w-full">
      <canvas ref={chartRef} />
    </div>
  );
};
