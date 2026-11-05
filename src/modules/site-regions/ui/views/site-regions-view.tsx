import Link from "next/link";
import { format } from "date-fns";
import { PanelBottomIcon, PanelTopIcon, PencilIcon } from "lucide-react";

import type { SiteRegionKey } from "@/generated/prisma";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

import {
  getSiteRegionStatusLabel,
  getSiteRegionStatusVariant,
  type SiteRegionSummary,
} from "../../lib/region-presentation";
import { SiteRegionPublishAction } from "../components/site-region-publish-action";

const REGION_ICONS: Record<SiteRegionKey, typeof PanelTopIcon> = {
  HEADER: PanelTopIcon,
  FOOTER: PanelBottomIcon,
};

function formatDate(value: Date | null): string {
  return value ? format(value, "d MMM yyyy, HH:mm") : "—";
}

const SiteRegionCard = ({ region }: { region: SiteRegionSummary }) => {
  const Icon = REGION_ICONS[region.key];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle>{region.title}</CardTitle>
              <CardDescription>{region.description}</CardDescription>
            </div>
          </div>
          <Badge variant={getSiteRegionStatusVariant(region.status)}>
            {getSiteRegionStatusLabel(region.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current version
            </span>
            <span className="text-sm">
              {region.currentVersionNumber
                ? `v${region.currentVersionNumber}`
                : "Not created"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Published version
            </span>
            <span className="text-sm">
              {region.liveVersionNumber
                ? `v${region.liveVersionNumber}`
                : "Not published"}
            </span>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Last updated</span>
            <span>{formatDate(region.updatedAt)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Published at</span>
            <span>{formatDate(region.publishedAt)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/site-regions/${region.key}`}>
            <PencilIcon data-icon="inline-start" />
            Edit layout
          </Link>
        </Button>
        <SiteRegionPublishAction region={region} />
      </CardFooter>
    </Card>
  );
};

export const SiteRegionsView = ({
  regions,
}: {
  regions: SiteRegionSummary[];
}) => {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Site layout</h1>
        <p className="text-sm text-muted-foreground">
          Edit the header and footer shared by every public page. Changes stay
          private until you publish them.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {regions.map((region) => (
          <SiteRegionCard key={region.key} region={region} />
        ))}
      </div>
    </div>
  );
};
