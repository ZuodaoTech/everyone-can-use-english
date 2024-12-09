import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { AudioPlayer } from "@renderer/components";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@renderer/components/ui";
import { t } from "i18next";
import { MediaShadowProvider } from "@renderer/context";
import { useState } from "react";

export default () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const segmentIndex = searchParams.get("segmentIndex") || "0";
  const [audio, setAudio] = useState<AudioType | null>(null);
  const navigate = useNavigate();

  return (
    <div className="h-content flex flex-col relative max-w-full">
      <Breadcrumb className="px-4 pt-3 pb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/audios`}>{t("sidebar.audios")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {audio?.name || t("shadowingAudio")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1">
        <MediaShadowProvider onCancel={() => navigate("/audios")}>
          <AudioPlayer
            id={id}
            segmentIndex={parseInt(segmentIndex)}
            onLoad={setAudio}
          />
        </MediaShadowProvider>
      </div>
    </div>
  );
};
