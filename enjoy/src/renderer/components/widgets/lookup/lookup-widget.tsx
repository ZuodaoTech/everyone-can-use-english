import { useEffect, useContext, useState, useRef } from "react";
import {
  AppSettingsProviderContext,
  DictProviderContext,
} from "@renderer/context";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Popover,
  PopoverAnchor,
  PopoverContent,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import {
  DictLookupResult,
  DictSelect,
  AiLookupResult,
  CamdictLookupResult,
  scoreColor,
  PronunciationAssessmentScoreDetail,
  PronunciationAssessmentFulltextResult,
  PronunciationAssessmentScoreResult,
  PronunciationAssessmentPhonemeResult,
} from "@renderer/components";
import {
  ChevronLeft,
  ChevronFirst,
  SpeakerIcon,
  MicIcon,
  SquareIcon,
  LoaderIcon,
  Volume2Icon,
  CheckIcon,
} from "lucide-react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { t } from "i18next";
import { usePronunciationAssessments } from "@/renderer/hooks";

export const LookupWidget = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentDictValue } = useContext(DictProviderContext);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    word: string;
    context?: string;
    sourceType?: string;
    sourceId?: string;
    position: {
      x: number;
      y: number;
    };
  }>();
  const [history, setHistory] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  const handleSelectionChanged = (
    _word: string,
    _context: string,
    position: { x: number; y: number }
  ) => {
    let word = _word;
    let context = _context;
    let sourceType;
    let sourceId;

    const selection = document.getSelection();

    if (!word) {
      if (!selection?.anchorNode?.parentElement) return;

      word = selection
        .toString()
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]+$/, "");

      // can only lookup single word
      if (!word || word.indexOf(" ") > -1) return;
    }

    if (!context) {
      context = selection?.anchorNode.parentElement
        .closest(".sentence, h2, p, div")
        ?.textContent?.trim();
      sourceType = selection?.anchorNode.parentElement
        .closest("[data-source-type]")
        ?.getAttribute("data-source-type");
      sourceId = selection?.anchorNode.parentElement
        .closest("[data-source-id]")
        ?.getAttribute("data-source-id");
    }

    setSelected({ word, context, position, sourceType, sourceId });
    handleLookup(word);
    setOpen(true);
  };

  useEffect(() => {
    EnjoyApp.onLookup((_event, selection, context, position) => {
      handleSelectionChanged(selection, context, position);
    });

    return () => EnjoyApp.offLookup();
  }, []);

  function handleLookup(word: string) {
    setCurrent(word);
    setHistory([...history, word]);
  }

  function handleViewFirst() {
    setCurrent(history[0]);
    setHistory(history.slice(0, 1));
  }

  function handleViewLast() {
    setCurrent(history[history.length - 2]);
    setHistory(history.slice(0, -1));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        className="fixed w-0 h-0"
        style={{
          top: selected?.position?.y,
          left: selected?.position?.x,
        }}
      />
      <PopoverContent
        className="w-full p-0 z-50"
        updatePositionStrategy="always"
      >
        {selected?.word && (
          <ScrollArea>
            <div className="w-96 h-96 flex flex-col">
              <div className="p-2 border-b space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {history.length > 1 && (
                      <div className="mr-1 flex items-center">
                        <Button
                          variant="ghost"
                          className="w-6 h-6 p-0"
                          onClick={handleViewFirst}
                        >
                          <ChevronFirst />
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-6 h-6 p-0"
                          onClick={handleViewLast}
                        >
                          <ChevronLeft />
                        </Button>
                      </div>
                    )}
                    <div className="font-bold">{current}</div>
                  </div>
                  <div className="w-40">
                    <DictSelect />
                  </div>
                </div>

                <div className="">
                  <VocabularyPronunciationAssessment word={current} />
                </div>
              </div>
              <div className="p-2 pr-1 flex-1">
                {currentDictValue === "ai" ? (
                  <AiLookupResult
                    word={selected?.word}
                    context={selected?.context}
                    sourceId={selected?.sourceId}
                    sourceType={selected?.sourceType}
                  />
                ) : currentDictValue === "cambridge" ? (
                  <CamdictLookupResult word={selected?.word} />
                ) : (
                  <DictLookupResult word={current} onJump={handleLookup} />
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

LookupWidget.displayName = "LookupWidget";

export const VocabularyPronunciationAssessment = (props: { word: string }) => {
  const { word } = props;
  const { EnjoyApp, recorderConfig, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const {
    startRecording,
    stopRecording,
    recordingBlob,
    isRecording,
    recordingTime,
  } = useAudioRecorder(recorderConfig, (exception) => {
    toast.error(exception.message);
  });
  const { createAssessment } = usePronunciationAssessments();
  const [access, setAccess] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState<RecordingType>();
  const [assessment, setAssessment] = useState<PronunciationAssessmentType>();
  const [open, setOpen] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  const askForMediaAccess = () => {
    EnjoyApp.system.preferences.mediaAccess("microphone").then((access) => {
      if (access) {
        setAccess(true);
      } else {
        setAccess(false);
        toast.warning(t("noMicrophoneAccess"));
      }
    });
  };

  const findRecording = () => {
    EnjoyApp.recordings
      .findOne({
        referenceText: word,
      })
      .then((recording) => {
        if (recording?.pronunciationAssessment) {
          setRecording(recording);
          setAssessment(recording.pronunciationAssessment);
        }
      });
  };

  const onRecorded = async (blob: Blob) => {
    if (!blob) return;

    let recording: RecordingType;
    try {
      recording = await EnjoyApp.recordings.create({
        language: learningLanguage,
        blob: {
          type: recordingBlob.type.split(";")[0],
          arrayBuffer: await blob.arrayBuffer(),
        },
        referenceText: word,
      });
    } catch (err) {
      toast.error(err.message);
    }
    if (!recording) return;

    setSubmitting(true);
    createAssessment({
      language: learningLanguage,
      reference: word,
      recording,
    })
      .then((assessment) => {
        setAssessment(assessment);
        setRecording(recording);
        setOpen(true);
      })
      .catch((err) => {
        toast.error(err.message);
        EnjoyApp.recordings.destroy(recording.id);
      })
      .finally(() => setSubmitting(false));
  };

  useEffect(() => {
    askForMediaAccess();
    findRecording();
  }, [word]);

  useEffect(() => {
    if (recording) {
      audio.current = new Audio(recording.src);
    }

    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, [recording]);

  useEffect(() => {
    if (recordingBlob) {
      onRecorded(recordingBlob);
    }
  }, [recordingBlob]);

  /**
   * Auto stop recording after 5 seconds
   */
  useEffect(() => {
    if (!isRecording) return;

    if (recordingTime >= 5) {
      stopRecording();
    }
  }, [recordingTime]);

  if (!word) return null;
  if (!access) return null;

  if (submitting) {
    return (
      <Button variant="ghost" className="size-6 p-0" disabled>
        <LoaderIcon className="size-4 animate-spin" />
      </Button>
    );
  }

  if (isRecording) {
    return (
      <Button
        variant="ghost"
        className="rounded-full size-6 p-0 bg-red-500 hover:bg-red-500/90"
        onClick={stopRecording}
      >
        <SquareIcon fill="white" className="size-3 text-white" />
      </Button>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          className="rounded-full size-6 p-0 bg-red-500 hover:bg-red-500/90"
          onClick={startRecording}
        >
          <MicIcon className="size-4 text-white" />
        </Button>
        {recording && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-0 size-6 border border-secondary"
            onClick={() => audio.current?.play()}
          >
            <Volume2Icon className="size-4" />
          </Button>
        )}
        {assessment && (
          <CollapsibleTrigger asChild>
            <Button
              variant={open ? "secondary" : "ghost"}
              size="icon"
              className="rounded-full p-0 size-6 border border-secondary"
            >
              <span
                className={`text-xs ${scoreColor(
                  assessment.pronunciationScore || 0
                )}`}
              >
                {assessment.pronunciationScore.toFixed(0)}
              </span>
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
      {assessment && (
        <CollapsibleContent className="mt-2">
          <div className="space-y-2">
            <PronunciationAssessmentPhonemeResult
              result={assessment.result.words[0]}
            />
            <PronunciationAssessmentScoreDetail
              assessment={assessment}
              fluencyScore={false}
              completenessScore={false}
            />
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};
