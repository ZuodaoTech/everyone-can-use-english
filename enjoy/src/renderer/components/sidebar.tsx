import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  ScrollArea,
} from "@renderer/components/ui";
import {
  SettingsIcon,
  HomeIcon,
  HeadphonesIcon,
  VideoIcon,
  NewspaperIcon,
  BookMarkedIcon,
  UserIcon,
  BotIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { t } from "i18next";
import { Preferences } from "@renderer/components";

export const Sidebar = () => {
  const location = useLocation();
  const activeTab = location.pathname;

  return (
    <div
      className="h-[100vh] w-20 xl:w-48 transition-all relative"
      data-testid="sidebar"
    >
      <div className="fixed top-0 left-0 h-full w-20 xl:w-48 bg-muted">
        <ScrollArea className="w-full h-full">
          <div className="py-4 flex items-center space-x-1 justify-center">
            <img src="./assets/logo-light.svg" className="w-8 h-8" />
            <span className="hidden xl:block text-xl font-semibold text-[#4797F5]">
              ENJOY
            </span>
          </div>
          <div className="xl:px-3 py-2">
            <div className="xl:pl-3">
              <Link
                to="/"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.home")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={activeTab === "/" ? "default" : "ghost"}
                  className="w-full xl:justify-start"
                >
                  <HomeIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">{t("sidebar.home")}</span>
                </Button>
              </Link>

              <Link
                to="/conversations"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.aiAssistant")}
                data-tooltip-place="right"
                data-testid="sidebar-conversations"
                className="block px-2"
              >
                <Button
                  variant={
                    activeTab.startsWith("/conversations")
                      ? "default"
                      : "ghost"
                  }
                  className="w-full xl:justify-start"
                >
                  <BotIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">
                    {t("sidebar.aiAssistant")}
                  </span>
                </Button>
              </Link>

              <Link
                to="/community"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.community")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={activeTab === "/community" ? "default" : "ghost"}
                  className="w-full xl:justify-start"
                >
                  <UsersRoundIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">
                    {t("sidebar.community")}
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="xl:px-3 py-2">
            <h3 className="hidden xl:block mb-2 px-4 text-lg font-semibold tracking-tight">
              {t("sidebar.library")}
            </h3>
            <div className="xl:pl-3 space-y-2">
              <Link
                to="/audios"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.audios")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={
                    activeTab.startsWith("/audios") ? "default" : "ghost"
                  }
                  className="w-full xl:justify-start"
                >
                  <HeadphonesIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">{t("sidebar.audios")}</span>
                </Button>
              </Link>

              <Link
                to="/videos"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.videos")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={
                    activeTab.startsWith("/videos") ? "default" : "ghost"
                  }
                  className="w-full xl:justify-start"
                >
                  <VideoIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">{t("sidebar.videos")}</span>
                </Button>
              </Link>

              <Link
                to="/stories"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.stories")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={
                    activeTab.startsWith("/stories") ? "default" : "ghost"
                  }
                  className="w-full xl:justify-start"
                >
                  <NewspaperIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">
                    {t("sidebar.stories")}
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="xl:px-3 py-2">
            <h3 className="hidden xl:block mb-2 px-4 text-lg font-semibold tracking-tight">
              {t("sidebar.mine")}
            </h3>
            <div className="xl:pl-3 space-y-2">
              <Link
                to="/vocabulary"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.vocabulary")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={
                    activeTab.startsWith("/vocabulary") ? "default" : "ghost"
                  }
                  className="w-full xl:justify-start"
                >
                  <BookMarkedIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">
                    {t("sidebar.vocabulary")}
                  </span>
                </Button>
              </Link>

              <Link
                to="/profile"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("sidebar.profile")}
                data-tooltip-place="right"
                className="block px-2"
              >
                <Button
                  variant={
                    activeTab.startsWith("/profile") ? "default" : "ghost"
                  }
                  className="w-full xl:justify-start"
                >
                  <UserIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">
                    {t("sidebar.profile")}
                  </span>
                </Button>
              </Link>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={
                      activeTab.startsWith("/settings") ? "default" : "ghost"
                    }
                    id="preferences-button"
                    className="w-full xl:justify-start"
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("sidebar.preferences")}
                    data-tooltip-place="right"
                  >
                    <SettingsIcon className="xl:mr-2 h-5 w-5" />
                    <span className="hidden xl:block">
                      {t("sidebar.preferences")}
                    </span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-screen-md xl:max-w-screen-lg h-5/6 p-0">
                  <Preferences />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
