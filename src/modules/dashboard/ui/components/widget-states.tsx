import { AlertCircleIcon, Loader2Icon } from "lucide-react";

/**
 * The bodies every Dashboard widget shares for its loading, error, and empty
 * outcomes. They render inside the widget card, so the card's chrome stays put
 * while its data loads, fails, or turns out empty — identically for every
 * widget.
 */

const stateBodyClassName =
  "flex min-h-32 flex-1 flex-col items-center justify-center gap-2 text-center";

/** The card body shown while a widget's data query is in flight. */
export const WidgetLoading = () => (
  <div className={stateBodyClassName} role="status" aria-label="Loading">
    <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
  </div>
);

/** The card body shown when a widget's data query fails. */
export const WidgetError = () => (
  <div className={stateBodyClassName}>
    <AlertCircleIcon className="size-5 text-destructive" />
    <p className="text-sm text-muted-foreground">Unable to load the widget.</p>
  </div>
);

/** The card body shown when a widget has no data to display. */
export const WidgetEmpty = ({ message }: { message: string }) => (
  <p className={`${stateBodyClassName} text-sm text-muted-foreground`}>
    {message}
  </p>
);
