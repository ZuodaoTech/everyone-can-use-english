import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { PostAudioPlayer } from "@renderer/components";
import { Avatar, AvatarImage, AvatarFallback } from "@renderer/components/ui";
import { t } from "i18next";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

export const Posts = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [posts, setPosts] = useState<PostType[]>([]);

  const fetchPosts = async () => {
    webApi.posts().then(
      (res) => {
        console.log(res);
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
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

const PostCard = (props: { post: PostType }) => {
  const { post } = props;

  return (
    <div className="rounded p-4 bg-white">
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={post.user.avatarUrl} />
            <AvatarFallback className="text-xl">
              {post.user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="">{post.user.name}</div>
        </div>
      </div>
      {post.content && <div className="mb-4">{post.content}</div>}
      {post.targetType == "Medium" && <PostMedium medium={post.target} />}
    </div>
  );
};

const PostMedium = (props: { medium: MediumType }) => {
  const { medium } = props;
  if (!medium.sourceUrl) return null;

  return (
    <>
      <div className="mb-2">
        {medium.mediumType == "Video" && (
          <MediaPlayer
            poster={medium.coverUrl}
            src={{
              type: `${medium.mediumType.toLowerCase()}/${
                medium.extname.replace(".", "") || "mp4"
              }`,
              src: medium.sourceUrl,
            }}
          >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        )}

        {medium.mediumType == "Audio" && (
          <PostAudioPlayer src={medium.sourceUrl} />
        )}
      </div>

      {medium.coverUrl && medium.mediumType == "Audio" && (
        <div className="">
          <img src={medium.coverUrl} className="w-full rounded" />
        </div>
      )}
    </>
  );
};
