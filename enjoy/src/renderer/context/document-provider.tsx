import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
  MediaShadowProvider,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import debounce from "lodash/debounce";
import { useSpeech } from "@renderer/hooks";

type DocumentProviderProps = {
  ref: React.RefObject<HTMLDivElement>;
  document: DocumentEType;
  playingSegmentId: string | null;
  playingSegment: {
    id: string;
    index: number;
    text: string;
  } | null;
  nextSegment: {
    id: string;
    index: number;
    text: string;
  } | null;
  togglePlayingSegment: (segment: string | null) => void;
  section: number;
  setSection: (section: number) => void;
  onSpeech: (segment: string) => void;
  onSegmentVisible: (id: string) => void;
  locateSegment: (id: string) => HTMLElement | null;
  content: string;
  setContent: (content: string) => void;
};

export const DocumentProviderContext = createContext<DocumentProviderProps>({
  ref: null,
  document: null,
  playingSegmentId: null,
  playingSegment: null,
  nextSegment: null,
  togglePlayingSegment: () => {},
  section: 0,
  setSection: () => {},
  onSpeech: () => {},
  onSegmentVisible: () => {},
  locateSegment: () => null,
  content: "",
  setContent: () => {},
});

export function DocumentProvider({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);

  const { tts } = useSpeech();

  const [document, setDocument] = useState<DocumentEType>(null);
  const [section, setSection] = useState(0);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [playingSegment, setPlayingSegment] = useState<{
    id: string;
    index: number;
    text: string;
  } | null>(null);
  const [nextSegment, setNextSegment] = useState<{
    id: string;
    index: number;
    text: string;
  } | null>(null);
  const [content, setContent] = useState<string>();

  const ref = useRef<HTMLDivElement>(null);

  const locateSegment = (id: string) => {
    return ref.current?.querySelector(`#${id}`) as HTMLElement | null;
  };

  const findNextSegment = async (index: number) => {
    if (!document.config.autoNextSpeech) return;

    const next: HTMLElement | null = ref.current?.querySelector(
      `[data-index="${index}"]`
    );
    if (!next) return;

    const text = next.querySelector(".segment-content")?.textContent?.trim();
    if (!text) {
      return findNextSegment(index + 1);
    }

    const existingSpeech = await EnjoyApp.speeches.findOne({
      sourceId: document.id,
      sourceType: "Document",
      section,
      segment: index,
    });

    if (!existingSpeech) {
      tts({
        sourceId: document.id,
        sourceType: "Document",
        section,
        segment: index,
        text,
        configuration: document.config.tts,
      });
    }
    setNextSegment({
      id: next.id,
      index,
      text,
    });
  };

  const onSegmentVisible = useCallback(
    (id: string) => {
      updateDocumentPosition(id);
    },
    [document]
  );

  const updateDocumentPosition = debounce((id: string) => {
    if (!id) return;

    const segment = locateSegment(id);
    if (!segment) return;

    const index = segment.dataset.index || "0";
    const sectionIndex = segment.dataset.section || "0";

    EnjoyApp.documents.update(document.id, {
      lastReadPosition: {
        section: parseInt(sectionIndex),
        segment: parseInt(index),
      },
      lastReadAt: new Date(),
    });
  }, 1000);

  const togglePlayingSegment = useCallback((segment: string | null) => {
    setPlayingSegmentId((prev) => (prev === segment ? null : segment));
  }, []);

  const onSpeech = useCallback(
    (segment: string) => {
      togglePlayingSegment(segment);
    },
    [togglePlayingSegment]
  );

  const fetchDocument = async () => {
    if (!documentId) return;

    EnjoyApp.documents
      .findOne({ id: documentId })
      .then((doc) => {
        setDocument(doc);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const handleDocumentUpdate = (event: CustomEvent) => {
    const { action, record } = event.detail;
    if (action === "update" && record.id === documentId) {
      setDocument(record as DocumentEType);
    }
  };

  useEffect(() => {
    if (!ref.current) return;
    if (!playingSegmentId) return;

    const element = locateSegment(playingSegmentId);
    if (!element) return;

    const index = parseInt(element.dataset.index || "0");
    findNextSegment(index + 1);
    setPlayingSegment({
      id: element.id,
      index,
      text: element.querySelector(".segment-content")?.textContent?.trim(),
    });

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("playing-segment", "bg-yellow-100");

    return () => {
      setPlayingSegment(null);
      element?.classList?.remove("playing-segment", "bg-yellow-100");
    };
  }, [ref, playingSegmentId]);

  // auto scroll to the top when new section is rendered
  useEffect(() => {
    if (!content) return;
    if (!ref?.current) return;

    if (document.lastReadPosition.section === section) {
      const element = locateSegment(
        `segment-${document.lastReadPosition.segment || 0}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [section, content]);

  useEffect(() => {
    if (!document) return;
    setSection(document.lastReadPosition.section || 0);
  }, [document]);

  useEffect(() => {
    fetchDocument();
    addDblistener(handleDocumentUpdate);

    return () => {
      removeDbListener(handleDocumentUpdate);
      setDocument(null);
    };
  }, [documentId]);

  return (
    <DocumentProviderContext.Provider
      value={{
        document,
        ref,
        playingSegmentId,
        playingSegment,
        nextSegment,
        togglePlayingSegment,
        section,
        setSection,
        onSpeech,
        onSegmentVisible,
        locateSegment,
        content,
        setContent,
      }}
    >
      <MediaShadowProvider
        layout={document?.config?.layout === "vertical" ? "normal" : "compact"}
        onCancel={() => togglePlayingSegment(null)}
      >
        <div ref={ref}>{children}</div>
      </MediaShadowProvider>
    </DocumentProviderContext.Provider>
  );
}
