import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { PostCard, LoaderSpin } from "@renderer/components";
import {
  toast,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
} from "@renderer/components//ui";
import { t } from "i18next";

export const Posts = (props: { userId?: string; by?: string }) => {
  const { userId } = props;
  const { webApi } = useContext(AppSettingsProviderContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [type, setType] = useState<
    "all" | "recording" | "medium" | "story" | "prompt" | "gpt" | "note"
  >("all");
  const [by, setBy] = useState<"all" | "following">("all");
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
        userId,
        by,
        type,
      })
      .then((res) => {
        if (page === 1) {
          setPosts(res.posts);
        } else {
          setPosts([...posts, ...res.posts]);
        }
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
    fetchPosts(1);
  }, [type, by]);

  if (loading) {
    return <LoaderSpin />;
  }

  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="flex justify-end space-x-4 py-4">
        {!userId && (
          <Select
            value={by}
            onValueChange={(value: "all" | "following") => setBy(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="following" value="following">
                {t("following")}
              </SelectItem>
              <SelectItem key="all" value="all">
                {t("allUsers")}
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          value={type}
          onValueChange={(
            value: "all" | "recording" | "medium" | "story" | "prompt" | "gpt"
          ) => setType(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="all" value="all">
              {t("allTypes")}
            </SelectItem>
            <SelectItem key="recording" value="recording">
              {t("recordingType")}
            </SelectItem>
            <SelectItem key="note" value="note">
              {t("noteType")}
            </SelectItem>
            <SelectItem key="prompt" value="prompt">
              {t("promptType")}
            </SelectItem>
            <SelectItem key="gpt" value="gpt">
              {t("gptType")}
            </SelectItem>
            <SelectItem key="medium" value="medium">
              {t("mediumType")}
            </SelectItem>
            <SelectItem key="story" value="story">
              {t("storyType")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {posts.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          {t("noOneSharedYet")}
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id}>
            <PostCard
              post={post}
              handleDelete={handleDelete}
              handleUpdate={(post) => {
                const updatedPosts = posts.map((p) => {
                  if (p.id === post.id) {
                    return Object.assign(p, post);
                  } else {
                    return p;
                  }
                });
                setPosts(updatedPosts);
              }}
            />
            <Separator />
          </div>
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
