import { useState, useEffect, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { ScrollArea, ScrollBar } from "@renderer/components/ui";
import { t } from "i18next";
import { Link } from "react-router-dom";

export const TedIdeasSegment = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [ideas, setIdeas] = useState<TedIdeaType[]>([]);

  const fetchIdeas = async () => {
    const cachedIdeas = await EnjoyApp.cacheObjects.get("ted-ideas");
    if (cachedIdeas) {
      setIdeas(cachedIdeas);
      return;
    }

    EnjoyApp.providers.ted
      .ideas()
      .then((ideas) => {
        if (ideas) {
          setIdeas(ideas);
          EnjoyApp.cacheObjects.set("ted-ideas", ideas, 60 * 60);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  if (!ideas?.length) return null;

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("from")} Ted Ideas
          </h2>
        </div>
      </div>

      <ScrollArea>
        <div className="flex items-center space-x-4 pb-4">
          {ideas.map((idea) => (
            <div key={idea.url} className="w-64">
              <Link to={`/stories/preview/${encodeURIComponent(idea.url)}`}>
                <div className="border rounded-lg overflow-hidden cursor-pointer">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={idea.cover}
                      className="w-full h-full object-cover hover:scale-105"
                    />
                  </div>

                  <div className="overflow-hidden px-4 py-2 h-16">
                    <div className="font-semibold line-clamp-2 ">
                      {idea.title}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
