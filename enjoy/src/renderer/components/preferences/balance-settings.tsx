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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
  Separator,
} from "@renderer/components/ui";
import { LoaderSpin } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { formatDateTime } from "@/renderer/lib/utils";
import Chart from "chart.js/auto";

export const BalanceSettings = () => {
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);
  const [balance, setBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentCreated, setPaymentCreated] = useState<boolean>(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [displayUsage, setDisplayUsage] = useState<boolean>(false);

  const refreshPayments = () => {
    webApi
      .payments({
        paymentType: "deposit",
      })
      .then(({ payments }) => {
        setPayments(payments);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const refreshBalance = () => {
    webApi.me().then((user) => {
      setBalance(user.balance);
    });
  };

  const createDepositPayment = (processor = "stripe") => {
    if (loading) return;

    setLoading(true);
    webApi
      .createPayment({
        amount: depositAmount,
        paymentType: "deposit",
        processor,
      })
      .then((payment) => {
        if (payment?.payUrl) {
          setPaymentCreated(true);
          EnjoyApp.shell.openExternal(payment.payUrl);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
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
          onOpenChange={(value) => {
            if (value) {
              refreshPayments();
            } else {
              setPaymentCreated(false);
              refreshBalance();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setPaymentCreated(false)}
              variant="secondary"
              size="sm"
              className=""
            >
              {t("deposit")}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-full overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("deposit")}</DialogTitle>
              <DialogDescription>{t("depositDescription")}</DialogDescription>
            </DialogHeader>

            {paymentCreated ? (
              <>
                <LoaderSpin />
                <div className="text-center">
                  {t("pleaseCompletePaymentInPopupWindow")}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {[2, 10, 50, 100].map((amount) => (
                    <div
                      className={`text-xl w-full h-20 border rounded-md flex items-center justify-center cursor-pointer shadow hover:bg-gray-100 hover:dark:text-primary-foreground transition-colors duration-200 ease-in-out ${
                        amount == depositAmount ? "bg-gray-100 dark:text-primary-foreground" : ""
                      }`}
                      key={`deposit-amount-${amount}`}
                      onClick={() => setDepositAmount(amount)}
                    >
                      ${amount}
                    </div>
                  ))}
                </div>
                <div className="text-sm">{t("depositDisclaimer")}</div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center w-64 justify-around">
                <img
                  src="assets/usdt.png"
                  className="w-auto h-8 rounded-full"
                />
                <img src="assets/usdc.png" className="w-auto h-8" />
                <img src="assets/eth.png" className="w-auto h-8" />
                <img src="assets/trx.png" className="w-auto h-8" />
                <img src="assets/doge.png" className="w-auto h-8" />
                <img src="assets/bnb.png" className="w-auto h-8" />
              </div>

              <Button
                variant="default"
                disabled={paymentCreated || loading}
                className="w-32 bg-blue-500 hover:bg-blue-600 transition-colors duration-200 ease-in-out"
                onClick={() => createDepositPayment("mixin")}
              >
                {loading && (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                )}
                <span>Crypto {t("pay")}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center w-64 justify-around">
                <img src="assets/mastercard.png" className="w-auto h-8" />
                <img src="assets/visa.png" className="w-auto h-8" />
                <img src="assets/unionpay.png" className="w-auto h-8" />
                <img src="assets/alipay.png" className="w-auto h-8" />
                <img src="assets/wechatpay.png" className="w-auto h-8" />
              </div>
              <Button
                className="w-32"
                variant="default"
                disabled={paymentCreated || loading}
                onClick={() => createDepositPayment()}
              >
                {loading && (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                )}
                <span>Stripe {t("pay")}</span>
              </Button>
            </div>

            <Separator />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">
                  {paymentCreated ? t("finish") : t("cancel")}
                </Button>
              </DialogClose>
            </DialogFooter>

            {payments.length > 0 && (
              <div className="">
                <Table>
                  <TableCaption>{t("recentDeposits")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead className="capitalize">
                        {t("amount")}
                      </TableHead>
                      <TableHead className="capitalize">
                        {t("status")}
                      </TableHead>
                      <TableHead className="capitalize">
                        {t("processor")}
                      </TableHead>
                      <TableHead className="capitalize">{t("date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <span className="text-xs bg-muted font-mono p-0.5 rounded select-text">
                            {payment.id.split("-").shift()}
                          </span>
                        </TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell className="">{payment.status}</TableCell>
                        <TableCell className="capitalize">
                          {payment.processor}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDateTime(payment.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);
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
