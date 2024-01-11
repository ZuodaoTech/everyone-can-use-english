import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

export const Posts = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [posts, setPosts] = useState<PostType[]>([]);

  const fetchPosts = async () => {
    webApi.posts().then(
      (res) => {
        setPosts(res.posts);
      },
      (err) => {
        console.error(err);
      }
    );
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="">
      {posts.length === 0 && (
        <div className="text-center text-gray-500">{t("noOneSharedYet")}</div>
      )}
    </div>
  );
};
