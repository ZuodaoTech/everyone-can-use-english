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

type DocumentProviderProps = {
  ref: React.RefObject<HTMLDivElement>;
  document: DocumentEType;
  playingParagraph: string | null;
  togglePlayingParagraph: (paragraph: string | null) => void;
  section: number;
  setSection: (section: number) => void;
};

export const DocumentProviderContext = createContext<DocumentProviderProps>({
  ref: null,
  document: null,
  playingParagraph: null,
  togglePlayingParagraph: () => {},
  section: 0,
  setSection: () => {},
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

  const togglePlayingParagraph = useCallback((paragraph: string | null) => {
    setPlayingParagraph((prev) => (prev === paragraph ? null : paragraph));
  }, []);

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
    const { state, record } = event.detail;
    if (state === "updated" && record.id === documentId) {
      setDocument(record as DocumentEType);
    }
  };

  useEffect(() => {
    addDblistener(handleDocumentUpdate);

    return () => {
      removeDbListener(handleDocumentUpdate);
    };
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
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
      }}
    >
      <MediaShadowProvider
        layout="compact"
        onCancel={() => setPlayingParagraph(null)}
      >
        <div ref={ref}>{children}</div>
      </MediaShadowProvider>
    </DocumentProviderContext.Provider>
  );
}
