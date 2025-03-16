import { useEffect } from "react";
import { useSettingsStore } from "../store/settings";

/**
 * Hook to initialize settings from the main process
 * This should be called once at the app's entry point
 */
export function useSettingsInit() {
  const { initialize } = useSettingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);
}
