import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "../context";
import { LoaderSpin, Posts } from "@renderer/components";
import { t } from "i18next";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui";

export default () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserType | null>(null);
  const { webApi, user: currentUser } = useContext(AppSettingsProviderContext);
  const navigate = useNavigate();

  const fetchUser = async () => {
    if (!id) return;

    webApi.user(id).then((user) => {
      setUser(user);
    });
  };

  const follow = () => {
    webApi.follow(id).then(() => {
      setUser({ ...user, following: true });
    });
  };

  const unfollow = () => {
    webApi.unfollow(id).then(() => {
      setUser({ ...user, following: false });
    });
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (!user) return <LoaderSpin />;

  return (
    <div className="h-full px-4 py-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/community">{t("sidebar.community")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{user.name}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <div className="flex justify-center mb-2">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xl">
                {user.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {currentUser.id != user.id && (
            <div className="flex justify-center">
              {user.following ? (
                <Button
                  variant="link"
                  className="text-destructive"
                  size="sm"
                  onClick={unfollow}
                >
                  {t("unfollow")}
                </Button>
              ) : (
                <Button size="sm" onClick={follow}>
                  {t("follow")}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="max-w-screen-sm mx-auto">
          <Tabs defaultValue="activities">
            <div className="w-full flex justify-center">
              <TabsList>
                <TabsTrigger value="activities">{t("activities")}</TabsTrigger>
                <TabsTrigger value="followers">
                  <span className="capitalize">{t("followers")}</span>
                </TabsTrigger>
                <TabsTrigger value="following">
                  <span className="capitalize">{t("following")}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="activities">
              <Posts userId={user.id} />
            </TabsContent>
            <TabsContent value="followers">
              <UserFollowers id={user.id} />
            </TabsContent>
            <TabsContent value="following">
              <UserFollowing id={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const UserFollowers = (props: { id: string }) => {
  const { id } = props;
  const [users, setUsers] = useState<UserType[]>([]);
  const { webApi } = useContext(AppSettingsProviderContext);
  const [page, setPage] = useState(1);

  const fetchFollowers = async () => {
    if (!page) return;

    webApi.userFollowers(id, { page }).then((res) => {
      setUsers(res.users);
      setPage(res.next);
    });
  };

  useEffect(() => {
    fetchFollowers();
    return () => {
      setUsers([]);
      setPage(1);
    };
  }, [id]);

  if (users.length === 0)
    return (
      <div className="w-full px-4 py-6 text-center text-sm text-muted-foreground">
        {t("noFollowersYet")}
      </div>
    );

  return (
    <>
      <div className="space-y-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
      {page && (
        <div className="flex justify-center py-4">
          <Button onClick={() => fetchFollowers()}>{t("loadMore")}</Button>
        </div>
      )}
    </>
  );
};

const UserFollowing = (props: { id: string }) => {
  const { id } = props;
  const [users, setUsers] = useState<UserType[]>([]);
  const { webApi } = useContext(AppSettingsProviderContext);
  const [page, setPage] = useState(1);

  const fetchFollowing = () => {
    if (!page) return;

    webApi.userFollowing(id, { page }).then((res) => {
      setUsers(res.users);
      setPage(res.next);
    });
  };

  useEffect(() => {
    fetchFollowing();
    return () => {
      setUsers([]);
      setPage(1);
    };
  }, [id]);

  if (users.length === 0)
    return (
      <div className="w-full px-4 py-6 text-center text-sm text-muted-foreground">
        {t("notFollowingAnyoneYet")}
      </div>
    );

  return (
    <>
      <div className="space-y-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
      {page && (
        <div className="flex justify-center py-4">
          <Button onClick={() => fetchFollowing()}>{t("loadMore")}</Button>
        </div>
      )}
    </>
  );
};

const UserCard = ({ user }: { user: UserType }) => {
  const { webApi, user: currentUser } = useContext(AppSettingsProviderContext);
  const [following, setFollowing] = useState<boolean>(user.following);

  const handleFollow = () => {
    if (following) {
      webApi.unfollow(user.id).then(() => {
        setFollowing(false);
      });
    } else {
      webApi.follow(user.id).then(() => {
        setFollowing(true);
      });
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 flex items-center space-x-4">
        <Link to={`/users/${user.id}`}>
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="text-xl">
              {user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="">
          <div className="truncated">{user.name}</div>
          <div className="text-sm text-muted-foreground">@{user.id}</div>
        </div>
      </div>

      <div className="">
        {currentUser.id != user.id && (
          <Button
            variant={following ? "secondary" : "default"}
            size="sm"
            onClick={handleFollow}
          >
            {following ? t("unfollow") : t("follow")}
          </Button>
        )}
      </div>
    </div>
  );
};
