import { useContext, useEffect, useState } from "react";
import { Client } from "@/api";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

export const Posts = () => {
  const { apiUrl, user } = useContext(AppSettingsProviderContext);
  const [posts, setPosts] = useState<PostType[]>([]);

  const client = new Client({
    baseUrl: apiUrl,
    accessToken: user.accessToken,
  });

  const fetchPosts = async () => {
    client.posts().then(
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
