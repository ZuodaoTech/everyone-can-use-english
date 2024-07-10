import { createContext, useEffect, useState, useContext } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  toast,
} from "@renderer/components/ui";
import {
  MediaPlayerProvider,
  AppSettingsProviderContext,
} from "@renderer/context";
import { ChevronDownIcon } from "lucide-react";
import { AudioPlayer } from "@renderer/components";

type CourseProviderState = {
  course?: CourseType;
  currentChapter?: ChapterType;
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
        shadowing,
        setShadowing,
      }}
    >
      <MediaPlayerProvider>
        {children}
        <Sheet
          modal={false}
          open={Boolean(shadowing)}
          onOpenChange={(value) => {
            if (!value) setShadowing(null);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-screen p-0"
            displayClose={false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <SheetHeader className="flex items-center justify-center h-14">
              <SheetTitle className="sr-only">Shadow</SheetTitle>
              <SheetClose>
                <ChevronDownIcon />
              </SheetClose>
            </SheetHeader>

            <AudioPlayer id={shadowing?.id} />
          </SheetContent>
        </Sheet>
      </MediaPlayerProvider>
    </CourseProviderContext.Provider>
  );
};
