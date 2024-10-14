import { useState, useEffect, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  ScrollArea,
  ScrollBar,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Progress,
} from "@renderer/components/ui";
import { t } from "i18next";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { useNavigate } from "react-router-dom";
import { LoaderIcon } from "lucide-react";

export const AudibleBooksSegment = () => {
  const navigate = useNavigate();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [books, setBooks] = useState<AudibleBookType[]>([]);
  const [selectedBook, setSelectedBook] = useState<AudibleBookType | null>(
    null
  );
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadSample = () => {
    if (!selectedBook.sample) return;

    setProgress(0);
    setDownloading(true);
    EnjoyApp.audios
      .create(selectedBook.sample, {
        name: selectedBook.title,
        coverUrl: selectedBook.cover,
      })
      .then((audio) => {
        if (!audio) return;
        navigate(`/audios/${audio.id}`);
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  const fetchAudibleBooks = async () => {
    const cachedBooks = await EnjoyApp.cacheObjects.get("audible-books");
    if (cachedBooks) {
      setBooks(cachedBooks);
      return;
    }

    EnjoyApp.providers.audible
      .bestsellers()
      .then((res) => {
        const { books = [] } = res || {};
        const filteredBooks =
          books?.filter((book) => book.language === "English") || [];

        if (filteredBooks.length) {
          EnjoyApp.cacheObjects.set("audible-books", filteredBooks, 60 * 60);
          setBooks(filteredBooks);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchAudibleBooks();
  }, []);

  useEffect(() => {
    if (!selectedBook) return;

    EnjoyApp.download.onState((_, downloadState) => {
      console.log(downloadState);
      const { state, received, total } = downloadState;
      if (state === "progressing") {
        setProgress(Math.floor((received / total) * 100));
      }
    });

    return () => {
      EnjoyApp.download.removeAllListeners();
    };
  }, [selectedBook]);

  if (!books?.length) return null;

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("from")} Audible.com
          </h2>
        </div>
        <div className="ml-auto mr-4"></div>
      </div>

      <ScrollArea>
        <div className="flex items-center space-x-4 pb-4">
          {books.map((book) => {
            return (
              <AudioBookCard
                key={book.title}
                book={book}
                onClick={() => setSelectedBook(book)}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog
        open={Boolean(selectedBook)}
        onOpenChange={(value) => {
          if (!value) setSelectedBook(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
          </DialogHeader>

          {selectedBook && <AudioBookPlayer book={selectedBook} />}

          <div className="flex items-center mb-4 bg-muted rounded-lg">
            <div className="aspect-square h-28 overflow-hidden rounded-l-lg">
              <img
                crossOrigin="anonymous"
                src={selectedBook?.cover}
                alt={selectedBook?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 py-3 px-4 h-28">
              <div className="text-lg font-semibold line-clamp-1">
                {selectedBook?.title}
              </div>
              <div className="text-sm line-clamp-1 mb-2">
                {selectedBook?.subtitle}
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {t("author")}: {selectedBook?.author}
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {t("narrator")}: {selectedBook?.narrator}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => EnjoyApp.shell.openExternal(selectedBook?.url)}
              variant="ghost"
              className="mr-auto"
            >
              {t("buy")}
            </Button>

            <Button onClick={() => setSelectedBook(null)} variant="secondary">
              {t("cancel")}
            </Button>
            <Button onClick={downloadSample} disabled={downloading}>
              {downloading && (
                <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
              )}
              {downloading
                ? progress < 100
                  ? t("downloading")
                  : t("importing")
                : t("downloadSample")}
            </Button>
          </DialogFooter>

          {downloading && progress > 0 && <Progress value={progress} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AudioBookPlayer = (props: { book: AudibleBookType }) => {
  const { book } = props;
  return (
    <MediaPlayer src={book.sample}>
      <MediaProvider />
      <DefaultAudioLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
};

const AudioBookCard = (props: {
  book: AudibleBookType;
  onClick?: () => void;
}) => {
  const { book, onClick } = props;

  return (
    <div onClick={onClick} className="w-36 cursor-pointer">
      <div className="aspect-square border rounded-lg overflow-hidden">
        <img
          crossOrigin="anonymous"
          src={book.cover}
          alt={book.title}
          className="hover:scale-105 object-cover w-full h-full"
        />
      </div>
      <div className="text-sm font-semibold mt-2 max-w-full line-clamp-1 h-5">
        {book.title}
      </div>
      <div className="text-xs font-muted-foreground max-w-full line-clamp-1 h-4">
        {book.author}
      </div>
    </div>
  );
};
