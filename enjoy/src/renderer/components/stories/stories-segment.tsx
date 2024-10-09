import { StoryCard } from "@renderer/components";
import { Button, ScrollArea, ScrollBar } from "@renderer/components/ui";
import { t } from "i18next";
import { Link } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export const StoriesSegment = () => {
  const [stories, setStorys] = useState<StoryType[]>([]);
  const { webApi } = useContext(AppSettingsProviderContext);

  const fetchStorys = async () => {
    webApi
      .mineStories()
      .then((response) => {
        if (response?.stories) {
          setStorys(response.stories);
        }
      })
      .catch((err) => {
        console.error(err.message);
      });
  };

  useEffect(() => {
    fetchStorys();
  }, []);

  if (stories.length == 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("addedStories")}
          </h2>
        </div>
        <div className="ml-auto mr-4">
          <Link to="/stories">
            <Button variant="link" className="capitalize">
              {t("seeMore")}
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea>
        <div className="flex items-center space-x-4 pb-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} className="w-64" />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
