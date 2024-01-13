import { Button } from "@renderer/components/ui";
import { StoryForm, StoryCard, LoaderSpin } from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

export default () => {
  const [stories, setStorys] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { webApi } = useContext(AppSettingsProviderContext);
  const [nextPage, setNextPage] = useState(1);

  const fetchStories = async (page: number = nextPage) => {
    if (!page) return;

    webApi
      .mineStories()
      .then((response) => {
        if (response?.stories) {
          setStorys([...stories, ...response.stories]);
        }
        setNextPage(response.next);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="min-h-[100vh] w-full max-w-5xl mx-auto px-4 py-6 lg:px-8">
      <div className="flex items-center justify-center mb-6">
        <StoryForm />
      </div>
      {loading ? (
        <LoaderSpin />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {nextPage && (
        <div className="py-4 flex justify-center">
          <Button variant="link" onClick={() => fetchStories(nextPage)}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
};
