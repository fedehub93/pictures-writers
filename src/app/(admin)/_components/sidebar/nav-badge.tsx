/**
 * Count bubble for a nav entry. Rendered only when there is something to
 * report: zero and absent counts take no space.
 */
export function NavBadge({ count }: { count?: number }) {
  if (!count) {
    return null;
  }

  return (
    <span
      aria-label={`${count} unread conversations`}
      className="ml-auto rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-sidebar-primary-foreground"
    >
      {count}
    </span>
  );
}
