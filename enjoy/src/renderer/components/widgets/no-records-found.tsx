import { BirdIcon } from "lucide-react";
import { t } from "i18next";

export const NoRecordsFound = (props: { text?: string }) => {
  const { text } = props;
  return (
    <div className="h-full w-full px-4 py-6 lg:px-8 flex justify-center items-center">
      <div className="flex items-center justify-center mb-2">
        <BirdIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        {text || t("noRecordsFound")}
      </div>
    </div>
  );
};
