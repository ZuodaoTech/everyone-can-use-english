import { useParams, useSearchParams, Link } from "react-router-dom";
import { AudioPlayer } from "@renderer/components";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@renderer/components/ui";
import { t } from "i18next";
import { MediaShadowProvider } from "@renderer/context";

export default () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const segmentIndex = searchParams.get("segmentIndex") || "0";

  return (
    <div className="h-screen flex flex-col relative">
      <Breadcrumb className="px-4 pt-3 pb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/audios`}>{t("sidebar.audios")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{t("shadowingAudio")}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1">
        <MediaShadowProvider>
          <AudioPlayer id={id} segmentIndex={parseInt(segmentIndex)} />
        </MediaShadowProvider>
      </div>
    </div>
  );
};
