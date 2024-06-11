import { ChevronLeftIcon } from "lucide-react";
import { Button } from "../ui";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppSettingsProviderContext } from "@/renderer/context";

export const PronunciationAssessmentForm = (props: {}) => {
  const navigate = useNavigate();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  return <div className=""></div>;
};
