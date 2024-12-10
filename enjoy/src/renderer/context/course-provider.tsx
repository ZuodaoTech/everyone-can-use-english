import { createContext, useEffect, useState, useContext } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@renderer/components/ui";
import {
  MediaShadowProvider,
  AppSettingsProviderContext,
} from "@renderer/context";
import { ChevronDownIcon } from "lucide-react";
import { AudioPlayer } from "@renderer/components";

type CourseProviderState = {
  course?: CourseType;
  currentChapter?: ChapterType;
  setCurrentChapter?: (chapter: ChapterType) => void;
  shadowing?: AudioType;
  setShadowing?: (audio: AudioType) => void;
};

const initialState: CourseProviderState = {};

export const CourseProviderContext =
  createContext<CourseProviderState>(initialState);

export const CourseProvider = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [course, setCourse] = useState<CourseType>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterType>(null);
  const [shadowing, setShadowing] = useState<AudioType>(null);

  const fetchCourse = async (id: string) => {
    webApi
      .course(id)
      .then((course) => setCourse(course))
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    fetchCourse(id);
  }, [id]);

  return (
    <CourseProviderContext.Provider
      value={{
        course,
        currentChapter,
        setCurrentChapter,
        shadowing,
        setShadowing,
      }}
    >
      <MediaShadowProvider onCancel={() => setShadowing(null)}>
        {children}
        <Sheet
          modal={false}
          open={Boolean(shadowing)}
          onOpenChange={(value) => {
            if (!value) setShadowing(null);
          }}
        >
          <SheetContent
            container="main-panel-content"
            side="bottom"
            className="h-content p-0 flex flex-col gap-0"
            displayClose={false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <SheetHeader className="flex items-center justify-center space-y-0 py-1">
              <SheetTitle className="sr-only">Shadow</SheetTitle>
              <SheetDescription className="sr-only"></SheetDescription>
              <SheetClose>
                <ChevronDownIcon />
              </SheetClose>
            </SheetHeader>

            {shadowing && <AudioPlayer id={shadowing.id} />}
          </SheetContent>
        </Sheet>
      </MediaShadowProvider>
    </CourseProviderContext.Provider>
  );
};
