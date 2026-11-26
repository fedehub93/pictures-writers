"use client";

/**
 * One labelled fact in a details surface. It renders a `dt`/`dd` pair, so the
 * caller wraps rows in a `dl`. Long values truncate on one line; the title
 * carries the full value for a reader who needs to check it.
 */
export function MediaDetailRow({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-x-4">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-right text-xs" title={title ?? value}>
        {value}
      </dd>
    </div>
  );
}
