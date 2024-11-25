import { createContext, useState, useEffect, useContext } from "react";
import log from "electron-log/renderer";

const logger = log.scope("db-provider.tsx");

type DbStateEnum =
  | "connected"
  | "connecting"
  | "error"
  | "disconnected"
  | "reconnecting";
type DbProviderState = {
  state: DbStateEnum;
  path?: string;
  error?: string;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  addDblistener?: (callback: (event: CustomEvent) => void) => void;
  removeDbListener?: (callback: (event: CustomEvent) => void) => void;
};

const initialState: DbProviderState = {
  state: "disconnected",
};

export const DbProviderContext = createContext<DbProviderState>(initialState);

export const DbProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<DbStateEnum>("disconnected");
  const [path, setPath] = useState();
  const [error, setError] = useState();
  const EnjoyApp = window.__ENJOY_APP__;

  const connect = async () => {
    if (["connected", "connecting"].includes(state)) return;
    console.info("--- connecting db ---");
    setState("connecting");

    return EnjoyApp.db
      .connect()
      .then((_db) => {
        setState(_db.state);
        setPath(_db.path);
        setError(_db.error);
      })
      .catch((err) => {
        setState("error");
        setError(err.message);
      });
  };

  const disconnect = () => {
    console.info("--- disconnecting db ---");
    setState("disconnected");
    return EnjoyApp.db.disconnect().then(() => {
      setState("disconnected");
      setPath(undefined);
      setError(undefined);
    });
  };

  useEffect(() => {
    console.info(
      "--- db state changed ---\n",
      `state: ${state};\n`,
      `path: ${path};\n`,
      `error: ${error};\n`
    );

    if (state === "disconnected") {
      setTimeout(() => {
        connect();
      }, 1000);
    }
  }, [state]);

  const addDblistener = (callback: (event: CustomEvent) => void) => {
    document.addEventListener("db-on-transaction", callback);
  };

  const removeDbListener = (callback: (event: CustomEvent) => void) => {
    document.removeEventListener("db-on-transaction", callback);
  };

  useEffect(() => {
    if (state === "connected") {
      EnjoyApp.db.onTransaction((_event, state) => {
        logger.debug("db-on-transaction", state);

        const event = new CustomEvent("db-on-transaction", { detail: state });
        document.dispatchEvent(event);
      });
    }

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
        disconnect,
        addDblistener,
        removeDbListener,
      }}
    >
      {children}
    </DbProviderContext.Provider>
  );
};
