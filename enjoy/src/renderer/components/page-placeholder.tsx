import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@renderer/components/ui/button";
import { t } from "i18next";

export const PagePlaceholder = (props: {
  placeholder?: string;
  extra?: string;
  showBackButton?: boolean;
}) => {
  const { placeholder, extra, showBackButton } = props;
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };
  return (
    <div className="flex h-full shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />

        <h3 className="mt-4 text-lg font-semibold">
          {placeholder || t("notReadyYet")}
        </h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">{extra}</p>
        {showBackButton && (
          <Button onClick={goBack} variant="secondary">
            {t("goBack")}
          </Button>
        )}
      </div>
    </div>
  );
};
