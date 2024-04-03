import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { PostCard, LoaderSpin } from "@renderer/components";
import { toast, Button } from "@renderer/components//ui";
import { t } from "i18next";

export const Posts = (props: { userId?: string }) => {
  const { userId } = props;
  const { webApi } = useContext(AppSettingsProviderContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [nextPage, setNextPage] = useState(1);

  const handleDelete = (id: string) => {
    webApi
      .deletePost(id)
      .then(() => {
        toast.success(t("removeSharingSuccessfully"));
        setPosts(posts.filter((post) => post.id !== id));
      })
      .catch((error) => {
        toast.error(t("removeSharingFailed"), { description: error.message });
      });
  };

  const fetchPosts = async (page: number = nextPage) => {
    if (!page) return;

    webApi
      .posts({
        page,
        items: 10,
        userId
      })
      .then((res) => {
        setPosts([...posts, ...res.posts]);
        setNextPage(res.next);
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <LoaderSpin />;
  }

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

      {nextPage && (
        <div className="py-4 flex justify-center">
          <Button variant="link" onClick={() => fetchPosts(nextPage)}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
};
