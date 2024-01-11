import { StoryForm, StoryCard, LoaderSpin } from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export default () => {
  const [stories, setStorys] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { webApi } = useContext(AppSettingsProviderContext);

  const fetchStorys = async () => {
    webApi
      .mineStories()
      .then((response) => {
        if (response?.stories) {
          setStorys(response.stories);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStorys();
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
    </div>
  );
};
