import {
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@renderer/components/ui";

export const UserCard = (props: { user: UserType; className?: string }) => {
  const { user, className = "" } = props;

  return (
    <Card className={className}>
      <CardContent className="px-4 py-2">
        <div className="flex space-x-4 items-center">
          <Avatar>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="text-xl">
              {user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="">
            <div className="">{user.name}</div>
            <div className="text-sm opacity-70">{user.id}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
