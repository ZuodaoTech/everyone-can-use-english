import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type DocumentProviderProps = {
  ref: React.RefObject<HTMLDivElement>;
  document: DocumentEType;
  playingParagraph: string | null;
  togglePlayingParagraph: (paragraph: string | null) => void;
  section: number;
  setSection: (section: number) => void;
  onSpeech: (paragraph: string) => void;
  onParagraphVisible: (id: string) => void;
};

export const DocumentProviderContext = createContext<DocumentProviderProps>({
  ref: null,
  document: null,
  playingParagraph: null,
  togglePlayingParagraph: () => {},
  section: 0,
  setSection: () => {},
  onSpeech: () => {},
  onParagraphVisible: () => {},
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
  const [document, setDocument] = useState<DocumentEType>(null);
  const [section, setSection] = useState(0);
  const [playingParagraph, setPlayingParagraph] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  const onParagraphVisible = useCallback((id: string) => {
    updateDocumentPosition(id);
  }, []);

  const updateDocumentPosition = debounce((id: string) => {
    if (!id) return;

    const paragraph: HTMLElement | null = ref.current?.querySelector(`#${id}`);
    if (!paragraph) return;

    const index = paragraph.dataset.index || "0";
    const sectionIndex = paragraph.dataset.section || "0";

    EnjoyApp.documents.update(document.id, {
      lastReadPosition: {
        section: parseInt(sectionIndex),
        paragraph: parseInt(index),
      },
      lastReadAt: new Date(),
    });
  }, 1000);

  const togglePlayingParagraph = useCallback((paragraph: string | null) => {
    setPlayingParagraph((prev) => (prev === paragraph ? null : paragraph));
  }, []);

  const onSpeech = useCallback(
    (paragraph: string) => {
      togglePlayingParagraph(paragraph);
    },
    [togglePlayingParagraph]
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
        playingParagraph,
        togglePlayingParagraph,
        section,
        setSection,
        onSpeech,
        onParagraphVisible,
      }}
    >
      <MediaShadowProvider
        layout="compact"
        onCancel={() => togglePlayingParagraph(null)}
      >
        <div ref={ref}>{children}</div>
      </MediaShadowProvider>
    </DocumentProviderContext.Provider>
  );
}
