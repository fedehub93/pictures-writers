import type { NavbarBlockUiProps } from "./types";
import { NavbarBlockUi } from "./ui/navbar-block";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The editor path receives the stored typed menu tree; the server renderer
 * resolves its SmartLinks and calls this function with the resolved tree. It
 * imports only the block UI, so the editor canvas stays database-free.
 */
export const renderNavbarBlock = ({ items, layout }: NavbarBlockUiProps) => (
  <NavbarBlockUi items={items} layout={layout} />
);
