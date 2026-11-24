"use client";

/**
 * One labelled fact in a details surface. It renders a `dt`/`dd` pair, so the
 * caller wraps rows in a `dl`. `mono` and `breakAll` are for values a reader
 * checks or copies whole, such as a checksum or a path.
 */
export function MediaDetailRow({
  label,
  value,
  title,
  mono = false,
  breakAll = false,
}: {
  label: string;
  value: string;
  title?: string;
  mono?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-x-4">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-right text-xs ${mono ? "font-mono" : ""} ${
          breakAll ? "break-all" : "truncate"
        }`}
        title={title ?? value}
      >
        {value}
      </dd>
    </div>
  );
}
