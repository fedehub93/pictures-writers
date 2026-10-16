import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * The person cell of a Dashboard list widget: a gradient avatar circle (falling
 * back to the name's initials, first and last, when there is no image) with the
 * name shown beside it. Used by the widgets whose rows name a person — an order
 * customer, a review author — and styled after the public review card.
 */
export const WidgetPerson = ({
  name,
  imageUrl,
}: {
  name: string | null;
  imageUrl?: string | null;
}) => {
  const label = name?.trim() || "—";

  return (
    <span className="flex items-center gap-2">
      <Avatar className="size-6">
        {imageUrl ? (
          <AvatarImage src={imageUrl} alt={label} className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary">
          {initials(label)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{label}</span>
    </span>
  );
};
