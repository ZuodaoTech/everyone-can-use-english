import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { LoaderSpin, MeaningMemorizingCard } from "@renderer/components";
import { t } from "i18next";

export default () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const { webApi } = useContext(AppSettingsProviderContext);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [nextPage, setNextPage] = useState(1);

  const fetchMeanings = async (page: number = nextPage) => {
    if (!page) return;

    webApi
      .mineMeanings({ page, items: 10 })
      .then((response) => {
        setMeanings([...meanings, ...response.meanings]);
        setNextPage(response.next);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMeanings(1);
  }, []);

  if (loading) {
    return <LoaderSpin />;
  }

  return (
    <div className="h-[100vh] bg-muted">
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <div className="flex space-x-1 items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span>{t("sidebar.vocabulary")}</span>
      </div>

      {meanings.length === 0 ? (
        <div className=""></div>
      ) : (
        <div className="h-[calc(100vh-5rem)] flex items-center justify-between space-x-6">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              }
            }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <div className="bg-background flex-1 h-5/6 border p-6 rounded-xl shadow-lg">
            <MeaningMemorizingCard meaning={meanings[currentIndex]} />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (currentIndex < meanings.length - 1) {
                setCurrentIndex(currentIndex + 1);
              }
              if (currentIndex === meanings.length - 2 && nextPage) {
                fetchMeanings(nextPage);
              }
            }}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
    </div>
  );
};
