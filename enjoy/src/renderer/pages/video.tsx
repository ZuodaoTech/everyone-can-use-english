import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { VideoPlayer } from "@renderer/components";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";
import { MediaShadowProvider } from "@renderer/context";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const segmentIndex = searchParams.get("segmentIndex") || "0";

  return (
    <div className="h-screen flex flex-col relative">
      <Breadcrumb className="px-4 pt-3 pb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/videos`}>{t("sidebar.videos")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{t("shadowingVideo")}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1">
        <MediaShadowProvider>
          <VideoPlayer id={id} segmentIndex={parseInt(segmentIndex)} />
        </MediaShadowProvider>
      </div>
    </div>
  );
};
