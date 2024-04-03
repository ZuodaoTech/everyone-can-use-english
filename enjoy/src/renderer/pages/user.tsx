import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "../context";
import { LoaderSpin, Posts } from "@renderer/components";
import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";
import { Avatar, AvatarFallback, AvatarImage, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui";

export default () => {
	const { id } = useParams<{ id: string }>();
	const [user, setUser] = useState<UserType | null>(null);
	const { webApi, user: currentUser } = useContext(AppSettingsProviderContext);
	const navigate = useNavigate();

	useEffect(() => {
		if (!id) return;

		webApi.user(id).then((user) => {
			setUser(user);
		});
	}, [id]);

	if (!user) return <LoaderSpin />;

	return (
		<div className="h-full px-4 py-6 lg:px-8">
			<div className="max-w-5xl mx-auto">
				<div className="flex space-x-1 items-center mb-4">
					<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
						<ChevronLeftIcon className="w-5 h-5" />
					</Button>
					<span>{user.name}</span>
				</div>

				<div className="mb-6">
					<div className="flex justify-center mb-2">
						<Avatar className="w-16 h-16">
							<AvatarImage src={user.avatarUrl} />
							<AvatarFallback className="text-xl">
								{user.name[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>

					{
						currentUser.id != user.id && <div className=""></div>
					}
				</div>

				<div className="max-w-screen-sm mx-auto">
					<Tabs defaultValue="activities">
						<div className="w-full flex justify-center">
							<TabsList>
								<TabsTrigger value="activities">{t('activities')}</TabsTrigger>
								<TabsTrigger value="followers">{t('followers')}</TabsTrigger>
								<TabsTrigger value="following">{t('following')}</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="activities">
							<Posts userId={user.id} />
						</TabsContent>
						<TabsContent value="followers">followers</TabsContent>
						<TabsContent value="following">following</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	)
}