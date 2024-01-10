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
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { t } from "i18next";
import { Preferences } from "@renderer/components";
import { Tooltip } from "react-tooltip";
import { useHotkeys } from "react-hotkeys-hook";

export const Sidebar = () => {
  const location = useLocation();
  const activeTab = location.pathname;

  useHotkeys("Control+Comma", () => {
    console.log("open preferences");
    document.getElementById("preferences-button")?.click();
  });

  return (
    <div className="h-[100vh] w-20 xl:w-48 2xl:w-64 transition-all relative">
      <div className="fixed top-0 left-0 h-full w-20 xl:w-48 2xl:w-64">
        <ScrollArea className="w-full h-full">
          <div className="px-1 xl:px-3 pt-6 mb-2 flex items-center space-x-1 justify-center">
            <img src="./assets/logo-light.svg" className="w-8 h-8" />
            <span className="hidden xl:block text-xl font-semibold text-[#4797F5]">
              ENJOY
            </span>
          </div>
          <div className="xl:px-3 py-4">
            <div className="xl:pl-3">
              <Link
                to="/"
                data-tooltip-id="sidebar-tooltip"
                data-tooltip-content={t("sidebar.home")}
                className="block"
              >
                <Button
                  variant={activeTab === "" ? "secondary" : "ghost"}
                  className="w-full xl:justify-start"
                >
                  <HomeIcon className="xl:mr-2 h-5 w-5" />
                  <span className="hidden xl:block">{t("sidebar.home")}</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-2 xl:space-y-4">
            <div className="xl:px-3 py-2">
              <h3 className="hidden xl:block mb-2 px-4 text-lg font-semibold tracking-tight">
                {t("sidebar.library")}
              </h3>
              <div className="xl:pl-3 space-y-2">
                <Link
                  to="/audios"
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={t("sidebar.audios")}
                  className="block"
                >
                  <Button
                    variant={
                      activeTab.startsWith("/audios") ? "secondary" : "ghost"
                    }
                    className="w-full xl:justify-start"
                  >
                    <HeadphonesIcon className="xl:mr-2 h-5 w-5" />
                    <span className="hidden xl:block">
                      {t("sidebar.audios")}
                    </span>
                  </Button>
                </Link>

                <Link
                  to="/videos"
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={t("sidebar.videos")}
                  className="block"
                >
                  <Button
                    variant={
                      activeTab.startsWith("/videos") ? "secondary" : "ghost"
                    }
                    className="w-full xl:justify-start"
                  >
                    <VideoIcon className="xl:mr-2 h-5 w-5" />
                    <span className="hidden xl:block">
                      {t("sidebar.videos")}
                    </span>
                  </Button>
                </Link>

                <Link
                  to="/stories"
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={t("sidebar.stories")}
                  className="block"
                >
                  <Button
                    variant={
                      activeTab.startsWith("/stories") ? "secondary" : "ghost"
                    }
                    className="w-full xl:justify-start"
                  >
                    <NewspaperIcon className="xl:mr-2 h-5 w-5" />
                    <span className="hidden xl:block">
                      {t("sidebar.stories")}
                    </span>
                  </Button>
                </Link>
                {/*  */}
                {/* <Link */}
                {/*   to="/books" */}
                {/*   data-tooltip-id="sidebar-tooltip" */}
                {/*   data-tooltip-content={t("sidebar.books")} */}
                {/*   className="block" */}
                {/* > */}
                {/*   <Button */}
                {/*     variant={ */}
                {/*       activeTab.startsWith("books") ? "secondary" : "ghost" */}
                {/*     } */}
                {/*     className="w-full xl:justify-start" */}
                {/*   > */}
                {/*     <BookOpenTextIcon className="xl:mr-2 h-5 w-5" /> */}
                {/*     <span className="hidden xl:block"> */}
                {/*       {t("sidebar.books")} */}
                {/*     </span> */}
                {/*   </Button> */}
                {/* </Link> */}
              </div>
            </div>

            <div className="xl:px-3 py-2">
              <h3 className="hidden xl:block mb-2 px-4 text-lg font-semibold tracking-tight">
                {t("sidebar.mine")}
              </h3>
              <div className="xl:pl-3 space-y-2">
                <Link
                  to="/conversations"
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={t("sidebar.aiAssistant")}
                  className="block"
                >
                  <Button
                    variant={
                      activeTab.startsWith("conversations")
                        ? "secondary"
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
                  to="/vocabulary"
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={t("sidebar.vocabulary")}
                  className="block"
                >
                  <Button
                    variant={
                      activeTab.startsWith("vocabulary") ? "secondary" : "ghost"
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
                  data-tooltip-id="sidebar-tooltip"
                  data-tooltip-content={t("sidebar.profile")}
                  className="block"
                >
                  <Button
                    variant={
                      activeTab.startsWith("/profile") ? "secondary" : "ghost"
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
                        activeTab.startsWith("/settings")
                          ? "secondary"
                          : "ghost"
                      }
                      id="preferences-button"
                      className="w-full xl:justify-start"
                      data-tooltip-id="sidebar-tooltip"
                      data-tooltip-content={t("sidebar.preferences")}
                    >
                      <SettingsIcon className="xl:mr-2 h-5 w-5" />
                      <span className="hidden xl:block">
                        {t("sidebar.preferences")}
                      </span>
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-full max-w-screen-md xl:max-w-screen-lg h-5/6 p-0">
                    <Preferences />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <Tooltip id="sidebar-tooltip" />
        </ScrollArea>
      </div>
    </div>
  );
};
