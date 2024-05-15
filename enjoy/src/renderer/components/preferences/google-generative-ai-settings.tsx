import { t } from "i18next";
import { Button, Input, Label, toast } from "@renderer/components/ui";
import { AISettingsProviderContext } from "@renderer/context";
import { useContext, useState, useRef, useEffect } from "react";

export const GoogleGenerativeAiSettings = () => {
  const { googleGenerativeAi, setGoogleGenerativeAi } = useContext(
    AISettingsProviderContext
  );
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>();

  const handleSave = () => {
    if (!ref.current) return;

    setGoogleGenerativeAi({
      key: ref.current.value,
    });
    setEditing(false);

    toast.success(t("googleGenerativeAiKeySaved"));
  };

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
    }
  }, [editing]);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">Google Generative AI</div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <Label className="min-w-max">{t("key")}:</Label>
            <Input
              ref={ref}
              type="password"
              defaultValue={googleGenerativeAi?.key}
              placeholder=""
              disabled={!editing}
              className="focus-visible:outline-0 focus-visible:ring-0 shadow-none"
            />
            {editing && (
              <Button
                size="sm"
                className="min-w-max text-md"
                onClick={handleSave}
              >
                {t("save")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="">
        <Button
          variant={editing ? "outline" : "secondary"}
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? t("cancel") : t("edit")}
        </Button>
      </div>
    </div>
  );
};
