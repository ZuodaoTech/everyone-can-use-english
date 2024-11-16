import { Navigate } from "react-router-dom";
import { AppSettingsProviderContext } from "../context";
import { useContext } from "react";

export const ProtectedPage = ({
  children,
  redirectPath = "/landing",
}: {
  children: React.ReactNode;
  redirectPath?: string;
}) => {
  const { initialized } = useContext(AppSettingsProviderContext);

  if (!initialized) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};
