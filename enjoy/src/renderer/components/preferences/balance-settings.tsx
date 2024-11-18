import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState, useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  toast,
} from "@renderer/components/ui";
import { Deposit } from "@renderer/components";
import Chart from "chart.js/auto";

export const BalanceSettings = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [balance, setBalance] = useState<number>(0);
  const [displayDepositDialog, setDisplayDepositDialog] =
    useState<boolean>(false);
  const [displayUsage, setDisplayUsage] = useState<boolean>(false);

  const refreshBalance = () => {
    webApi.me().then((user) => {
      setBalance(user.balance);
    });
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  if (!balance) return null;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("balance")}</div>
        <div className="text-sm text-muted-foreground mb-2">${balance}</div>
      </div>

      <div className="flex gap-2 items-center">
        <Dialog
          open={displayDepositDialog}
          onOpenChange={setDisplayDepositDialog}
        >
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="">
              {t("deposit")}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-full overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("deposit")}</DialogTitle>
              <DialogDescription>{t("depositDescription")}</DialogDescription>
            </DialogHeader>

            {displayDepositDialog && <Deposit />}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">{t("close")}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
