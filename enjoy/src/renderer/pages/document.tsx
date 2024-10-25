import { t } from "i18next";
import { ScrollArea, toast } from "@renderer/components/ui";
import {
  LoaderSpin,
  PagePlaceholder,
  StoryToolbar,
  StoryViewer,
  StoryVocabularySheet,
} from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { useAiCommand } from "@renderer/hooks";
import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.plugin(paragraphs);

export default () => {
  const { id } = useParams<{ id: string }>();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  return <div>{id}</div>;
};
