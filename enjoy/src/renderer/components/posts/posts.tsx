import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { PostCard } from "@renderer/components";
import { useToast } from "@renderer/components//ui";
import { t } from "i18next";

export const Posts = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [posts, setPosts] = useState<PostType[]>([]);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    webApi
      .deletePost(id)
      .then(() => {
        toast({
          description: t("removeSharingSuccessfully"),
        });
        setPosts(posts.filter((post) => post.id !== id));
      })
      .catch((error) => {
        toast({
          title: t("removeSharingFailed"),
          description: error.message,
          variant: "destructive",
        });
      });
  };

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
    <div className="max-w-screen-sm mx-auto">
      {posts.length === 0 && (
        <div className="text-center text-gray-500">{t("noOneSharedYet")}</div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} handleDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};
