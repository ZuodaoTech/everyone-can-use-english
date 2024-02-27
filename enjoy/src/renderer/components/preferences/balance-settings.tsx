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
} from "@renderer/components/ui";
import { LoaderIcon } from "lucide-react";

export const BalanceSettings = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [balance, setBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentCreated, setPaymentCreated] = useState<boolean>(false);

  const createDepositPayment = () => {
    if (loading) return;

    setLoading(true);
    webApi
      .createPayment({
        amount: depositAmount,
        paymentType: "deposit",
        proccessor: "stripe",
      })
      .then((payment) => {
        if (payment?.payUrl) {
          setPaymentCreated(true);
          window.open(payment.payUrl, "_blank");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    webApi.me().then((user) => {
      setBalance(user.balance);
    });
  }, []);

  if (!balance) return null;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("balance")}</div>
        <div className="text-sm text-muted-foreground mb-2">${balance}</div>
      </div>

      <Dialog>
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

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deposit")}</DialogTitle>
            <DialogDescription>{t("depositDescription")}</DialogDescription>
          </DialogHeader>

          {paymentCreated ? (
            <div className="text-center">
              {t("pleaseCompletePaymentInBrowser")}
            </div>
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
              <div className="text-sm">{t("depositAlert")}</div>
            </>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t("cancel")}</Button>
            </DialogClose>
            <Button
              variant="default"
              disabled={loading}
              onClick={createDepositPayment}
            >
              {loading && <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />}
              {t("deposit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
