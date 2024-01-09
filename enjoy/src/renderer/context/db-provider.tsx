import { createContext, useState, useEffect, useContext } from "react";
import { AppSettingsProviderContext } from "./app-settings-provider";
import log from "electron-log/renderer";

type DbStateEnum = "connected" | "connecting" | "error" | "disconnected";
type DbState = {
  state: DbStateEnum;
  path?: string;
  error?: string;
  connect?: () => void;
  addDblistener?: (callback: (event: CustomEvent) => void) => void;
  removeDbListener?: (callback: (event: CustomEvent) => void) => void;
};
type DbProviderState = DbState & {
  connect?: () => void;
};

const initialState: DbProviderState = {
  state: "disconnected",
};

export const DbProviderContext = createContext<DbProviderState>(initialState);

export const DbProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<DbStateEnum>("disconnected");
  const [path, setPath] = useState();
  const [error, setError] = useState();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const connect = async () => {
    if (["connected", "connecting"].includes(state)) return;

    setState("connecting");

    const _db = await EnjoyApp.db.init();

    setState(_db.state);
    setPath(_db.path);
    setError(_db.error);
  };

  const addDblistener = (callback: (event: CustomEvent) => void) => {
    document.addEventListener("db-on-transaction", callback);
  };

  const removeDbListener = (callback: (event: CustomEvent) => void) => {
    document.removeEventListener("db-on-transaction", callback);
  };

  useEffect(() => {
    if (state !== "connected") return;

    EnjoyApp.db.onTransaction((_event, state) => {
      log.debug("db-on-transaction", state);

      const event = new CustomEvent("db-on-transaction", { detail: state });
      document.dispatchEvent(event);
    });

    return () => {
      EnjoyApp.db.removeListeners();
    };
  }, [state]);

  return (
    <DbProviderContext.Provider
      value={{
        state,
        path,
        error,
        connect,
        addDblistener,
        removeDbListener,
      }}
    >
      {children}
    </DbProviderContext.Provider>
  );
};
