import { GRID_COLUMNS } from "./widget-size";

/**
 * Lays the row's items into the dashboard grid, in list order, packing them
 * greedily: an item that does not fit the current row starts the next one.
 * Whenever a row does not add up to the full grid — the last row, or any row a
 * later item could not join — the row's last item is stretched to close it, so
 * no row ever shows a horizontal hole.
 *
 * Pure and framework-free: given the ordered column counts it returns the
 * effective column count for each, same length, same order.
 */
export const resolveRowSpans = (
  units: number[],
  columns: number = GRID_COLUMNS,
): number[] => {
  const spans = units.map((unit) => Math.min(unit, columns));

  let rowSum = 0;

  for (let index = 0; index < spans.length; index += 1) {
    if (rowSum + spans[index] > columns) {
      // The current item cannot join the row: close the row by stretching its
      // last item, then begin a new row with the item.
      spans[index - 1] += columns - rowSum;
      rowSum = spans[index];
    } else {
      rowSum += spans[index];
    }
  }

  // Close the final row, if it is partial.
  if (spans.length > 0 && rowSum < columns) {
    spans[spans.length - 1] += columns - rowSum;
  }

  return spans;
};
