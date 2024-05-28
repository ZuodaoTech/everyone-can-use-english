import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState, useEffect } from "react";
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
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
} from "@renderer/components/ui";
import { LoaderSpin } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { formatDateTime } from "@/renderer/lib/utils";

export const BalanceSettings = () => {
  const { webApi, user } = useContext(AppSettingsProviderContext);
  const [balance, setBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentCreated, setPaymentCreated] = useState<boolean>(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [assests, setAssests] = useState<any[]>([]);
  const [currency, setCurrency] = useState<string>("");

  const fetchAssests = () => {
    webApi
      .config("supported_assets")
      .then((assests) => {
        setAssests(assests);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

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
        reconciledCurrency: processor === "stripe" ? "" : currency,
        paymentType: "deposit",
        processor,
      })
      .then((payment) => {
        if (payment?.payUrl) {
          setPaymentCreated(true);
          window.open(payment.payUrl, "model");
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
    fetchAssests();
  }, []);

  if (!balance) return null;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("balance")}</div>
        <div className="text-sm text-muted-foreground mb-2">${balance}</div>
      </div>

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
                {[1, 2, 5, 10].map((amount) => (
                  <div
                    className={`text-xl w-full h-20 border rounded-md flex items-center justify-center cursor-pointer shadow hover:bg-gray-100 transition-colors duration-200 ease-in-out ${
                      amount == depositAmount ? "bg-gray-100" : ""
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

          {user.hasMixin && (
            <div className="flex items-center justify-between space-x-4">
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(value)}
                disabled={paymentCreated || loading}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={t("selectCrypto")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {assests.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        <div className="flex items-center">
                          <div className="w-6 h-6 relative mr-2">
                            <img
                              src={asset.iconUrl}
                              className="w-full h-full"
                            />
                            {asset.chain && asset.chain.id !== asset.id && (
                              <img
                                src={asset.chain.iconUrl}
                                className="absolute bottom-0 -left-1 w-3 h-3"
                              />
                            )}
                          </div>
                          <span>{asset.displaySymbol}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                variant="default"
                disabled={paymentCreated || loading}
                className="w-32 bg-blue-500 hover:bg-blue-600 transition-colors duration-200 ease-in-out"
                onClick={() => createDepositPayment("mixin")}
              >
                {loading && (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                )}
                <span>Mixin {t("pay")}</span>
              </Button>
            </div>
          )}

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
              {loading && <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />}
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
                    <TableHead className="capitalize">{t("amount")}</TableHead>
                    <TableHead className="capitalize">{t("status")}</TableHead>
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
    </div>
  );
};
