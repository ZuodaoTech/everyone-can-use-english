import { t } from "i18next";
import { DictImportButton } from "./dict-import-button";
import { InstalledDictList } from ".";

export const DictSettings = () => {
  return (
    <>
      <div className="mb-4">
        <div className="flex justify-between pt-4 ">
          <div className="mb-2">{t("dictionaries")}</div>
          <DictImportButton />
        </div>

        <div className="my-4">
          <InstalledDictList />
        </div>
      </div>
    </>
  );
};
