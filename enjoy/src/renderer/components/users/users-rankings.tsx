import { useContext, useEffect, useState } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { secondsToTimestamp } from "@renderer/lib/utils";

export const UsersRankings = () => {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <RankingsCard range="day" />
      <RankingsCard range="week" />
      <RankingsCard range="month" />
      <RankingsCard range="all" />
    </div>
  );
};

const RankingsCard = (props: {
  range: "day" | "week" | "month" | "year" | "all";
}) => {
  const { range } = props;
  const { webApi } = useContext(AppSettingsProviderContext);
  const [rankings, setRankings] = useState<UserType[]>([]);

  const fetchRankings = async () => {
    webApi.rankings(range).then(
      (res) => {
        setRankings(res.rankings);
      },
      (err) => {
        console.error(err);
      }
    );
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${range}Rankings`)}</CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 && (
          <div className="text-center text-gray-500">
            {t("noOneHasRecordedYet")}
          </div>
        )}

        {rankings.map((user, index) => (
          <div key={user.id} className="flex items-center space-x-4 p-2">
            <div className="font-mono text-sm w-5">#{index + 1}</div>

            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-xl">
                  {user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="max-w-20 truncate">{user.name}</div>
            </div>

            <div className="flex-1 text-right">
              {secondsToTimestamp(user.recordingsDuration / 1000.0)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
