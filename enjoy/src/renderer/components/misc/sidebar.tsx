import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  ScrollArea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
  Separator,
  DialogTitle,
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
  LucideIcon,
  HelpCircleIcon,
  ExternalLinkIcon,
  NotebookPenIcon,
  SpeechIcon,
  GraduationCapIcon,
  MessagesSquareIcon,
  PanelLeftOpenIcon,
  PanelLeftCloseIcon,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { t } from "i18next";
import { Preferences } from "@renderer/components";
import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { useContext, useEffect } from "react";
import { NoticiationsChannel } from "@renderer/cables";
import { useState } from "react";

export const Sidebar = () => {
  const location = useLocation();
  const activeTab = location.pathname;
  const { EnjoyApp, cable } = useContext(AppSettingsProviderContext);
  const { active, setActive } = useContext(CopilotProviderContext);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!cable) return;

    const channel = new NoticiationsChannel(cable);
    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [cable]);

  // Save the sidebar state to cache
  useEffect(() => {
    EnjoyApp.cacheObjects.set("sidebarOpen", isOpen);
  }, [isOpen]);

  // Restore the sidebar state from cache
  useEffect(() => {
    EnjoyApp.cacheObjects.get("sidebarOpen").then((value) => {
      if (value !== undefined) {
        setIsOpen(!!value);
      }
    });
  }, []);

  return (
    <div
      className={`h-[100vh] transition-all relative ${
        isOpen ? "w-36" : "w-14"
      }`}
      data-testid="sidebar"
    >
      <div
        className={`fixed top-0 left-0 h-full bg-muted ${
          isOpen ? "w-36" : "w-14"
        }`}
      >
        <ScrollArea className="w-full h-full pb-12">
          <div className="py-4 mb-4 flex items-center space-x-1 justify-center">
            <img
              src="./assets/logo-light.svg"
              className="w-8 h-8 cursor-pointer hover:animate-spin"
              onClick={() => setActive(!active)}
            />
            <span
              className={`text-xl font-semibold text-[#4797F5] ${
                isOpen ? "" : "hidden"
              }`}
            >
              ENJOY
            </span>
          </div>
          <div className="grid gap-2 mb-4">
            <SidebarItem
              href="/"
              label={t("sidebar.home")}
              tooltip={t("sidebar.home")}
              active={activeTab === "/"}
              Icon={HomeIcon}
              isOpen={isOpen}
            />

            <SidebarItem
              href="/chats"
              label={t("sidebar.chats")}
              tooltip={t("sidebar.chats")}
              active={activeTab.startsWith("/chats")}
              Icon={MessagesSquareIcon}
              isOpen={isOpen}
            />

            <SidebarItem
              href="/courses"
              label={t("sidebar.courses")}
              tooltip={t("sidebar.courses")}
              active={activeTab.startsWith("/courses")}
              Icon={GraduationCapIcon}
              isOpen={isOpen}
            />

            <Separator />

            <SidebarItem
              href="/audios"
              label={t("sidebar.audios")}
              tooltip={t("sidebar.audios")}
              active={activeTab.startsWith("/audios")}
              Icon={HeadphonesIcon}
              isOpen={isOpen}
            />

            <SidebarItem
              href="/videos"
              label={t("sidebar.videos")}
              tooltip={t("sidebar.videos")}
              active={activeTab.startsWith("/videos")}
              Icon={VideoIcon}
              isOpen={isOpen}
            />

            <SidebarItem
              href="/stories"
              label={t("sidebar.stories")}
              tooltip={t("sidebar.stories")}
              active={activeTab.startsWith("/stories")}
              Icon={NewspaperIcon}
              isOpen={isOpen}
            />

            <Separator />

            <SidebarItem
              href="/conversations"
              label={t("sidebar.aiAssistant")}
              tooltip={t("sidebar.aiAssistant")}
              active={activeTab.startsWith("/conversations")}
              Icon={BotIcon}
              testid="sidebar-conversations"
              isOpen={isOpen}
            />

            <SidebarItem
              href="/pronunciation_assessments"
              label={t("sidebar.pronunciationAssessment")}
              tooltip={t("sidebar.pronunciationAssessment")}
              active={activeTab.startsWith("/pronunciation_assessments")}
              Icon={SpeechIcon}
              testid="sidebar-pronunciation-assessments"
              isOpen={isOpen}
            />

            <SidebarItem
              href="/notes"
              label={t("sidebar.notes")}
              tooltip={t("sidebar.notes")}
              active={activeTab === "/notes"}
              Icon={NotebookPenIcon}
              isOpen={isOpen}
            />

            <SidebarItem
              href="/vocabulary"
              label={t("sidebar.vocabulary")}
              tooltip={t("sidebar.vocabulary")}
              active={activeTab.startsWith("/vocabulary")}
              Icon={BookMarkedIcon}
              isOpen={isOpen}
            />

            <Separator />

            <SidebarItem
              href="/community"
              label={t("sidebar.community")}
              tooltip={t("sidebar.community")}
              active={activeTab === "/community"}
              Icon={UsersRoundIcon}
              isOpen={isOpen}
            />

            <SidebarItem
              href="/profile"
              label={t("sidebar.profile")}
              tooltip={t("sidebar.profile")}
              active={activeTab.startsWith("/profile")}
              Icon={UserIcon}
              isOpen={isOpen}
            />

            <Separator />

            <Dialog>
              <DialogTrigger asChild>
                <div className="px-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    id="preferences-button"
                    className={`w-full ${
                      isOpen ? "justify-start" : "justify-center"
                    }`}
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("sidebar.preferences")}
                    data-tooltip-place="right"
                  >
                    <SettingsIcon className="h-5 w-5" />
                    {isOpen && (
                      <span className="ml-2"> {t("sidebar.preferences")} </span>
                    )}
                  </Button>
                </div>
              </DialogTrigger>

              <DialogContent
                aria-describedby={undefined}
                className="max-w-screen-md xl:max-w-screen-lg h-5/6 p-0"
              >
                <DialogTitle className="hidden">
                  {t("sidebar.preferences")}
                </DialogTitle>
                <Preferences />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="px-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`w-full ${
                      isOpen ? "justify-start" : "justify-center"
                    }`}
                  >
                    <HelpCircleIcon className="h-5 w-5" />
                    {isOpen && (
                      <span className="ml-2"> {t("sidebar.help")} </span>
                    )}
                  </Button>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="px-6">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() =>
                      EnjoyApp.shell.openExternal("https://998h.org/enjoy-app/")
                    }
                    className="flex justify-between space-x-4"
                  >
                    <span>{t("userGuide")}</span>
                    <ExternalLinkIcon className="h-6 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {t("feedback")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() =>
                            EnjoyApp.shell.openExternal(
                              "https://mixin.one/codes/f6ff96b8-54fb-4ad8-a6d4-5a5bdb1df13e"
                            )
                          }
                          className="flex justify-between space-x-4"
                        >
                          <span>Mixin</span>
                          <ExternalLinkIcon className="h-6 w-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            EnjoyApp.shell.openExternal(
                              "https://github.com/zuodaotech/everyone-can-use-english/discussions"
                            )
                          }
                          className="flex justify-between space-x-4"
                        >
                          <span>Github</span>
                          <ExternalLinkIcon className="h-6 w-4" />
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ScrollArea>

        <div className="w-full absolute bottom-0 pt-4 pb-2 px-1">
          <Button
            size="sm"
            variant="ghost"
            className={`w-full ${isOpen ? "justify-start" : "justify-center"}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <PanelLeftCloseIcon className="h-5 w-5" />
            ) : (
              <PanelLeftOpenIcon className="h-5 w-5" />
            )}
            {isOpen && <span className="ml-2"> {t("sidebar.collapse")} </span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = (props: {
  href: string;
  label: string;
  tooltip: string;
  active: boolean;
  Icon: LucideIcon;
  testid?: string;
  isOpen: boolean;
}) => {
  const { href, label, tooltip, active, Icon, testid, isOpen } = props;

  return (
    <Link
      to={href}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={tooltip}
      data-tooltip-place="right"
      data-testid={testid}
      className="block px-1"
    >
      <Button
        size="sm"
        variant={active ? "default" : "ghost"}
        className={`w-full ${isOpen ? "justify-start" : "justify-center"}`}
      >
        <Icon className="h-5 w-5" />
        {isOpen && <span className="ml-2">{label}</span>}
      </Button>
    </Link>
  );
};
