import { useTheme } from "@renderer/context";
import { MoonIcon, SunIcon } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui";
import { t } from "i18next";

export const ThemeSettings = () => {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("theme")}</div>
        <div className="text-sm text-muted-foreground mb-2">{t(theme)}</div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Select
            value={theme}
            onValueChange={(theme: "light" | "dark" | "system") => {
              setTheme(theme);
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue>
                <Button asChild variant="ghost" size="icon">
                  <a>
                    <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </a>
                </Button>
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem className="text-xs" value="light">
                {t("light")}
              </SelectItem>
              <SelectItem className="text-xs" value="dark">
                {t("dark")}
              </SelectItem>
              <SelectItem className="text-xs" value="system">
                {t("system")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
