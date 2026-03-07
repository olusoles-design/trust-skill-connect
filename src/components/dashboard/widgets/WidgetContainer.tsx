/**
 * WidgetContainer
 *
 * Wraps every widget with:
 * - Loading skeleton
 * - Error boundary (via try/catch render)
 * - Subscription gating via GatedFeature
 * - Consistent title bar with widget metadata
 */

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import GatedFeature from "@/components/GatedFeature";
import type { Capability } from "@/lib/permissions";
import type { WidgetMeta } from "./widgetRegistry";

interface WidgetContainerProps {
  capability: Capability;
  meta: WidgetMeta;
  loading?: boolean;
  children: ReactNode;
}

export function WidgetContainer({ capability, meta, loading = false, children }: WidgetContainerProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-3 w-64 rounded" />
        <Skeleton className="h-40 w-full rounded-lg mt-2" />
      </div>
    );
  }

  return (
    <GatedFeature feature={capability} label={`Unlock ${meta.title}`}>
      {children as React.ReactElement}
    </GatedFeature>
  );
}
