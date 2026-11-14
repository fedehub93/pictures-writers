import {
  ImageIcon,
  SmileIcon,
  MousePointerClickIcon,
  FormIcon,
  SeparatorHorizontalIcon,
  SearchIcon,
  SquareIcon,
  HeadingIcon,
  TextIcon,
  TagIcon,
  ListIcon,
  CopyrightIcon,
  LayoutGridIcon,
  Rows3Icon,
  PanelTopIcon,
  MenuIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Editor sidebar presentation for the registered Puck blocks.
 *
 * Kept in its own module so the icon and label tables can be tested without
 * importing the Puck editor shell. A block missing from these maps keeps the
 * generic square icon and its raw registry name.
 */
export const ELEMENT_ICONS: Record<string, LucideIcon> = {
  Container: SquareIcon,
  Flex: Rows3Icon,
  Grid: LayoutGridIcon,
  Heading: HeadingIcon,
  Text: TextIcon,
  Image: ImageIcon,
  Icon: SmileIcon,
  Button: MousePointerClickIcon,
  Form: FormIcon,
  Separator: SeparatorHorizontalIcon,
  Brand: TagIcon,
  LinkList: ListIcon,
  Copyright: CopyrightIcon,
  TopBar: PanelTopIcon,
  SearchBar: SearchIcon,
  NavbarBlock: MenuIcon,
};

export const ELEMENT_LABELS: Record<string, string> = {
  LinkList: "Link list",
  TopBar: "Top bar",
  SearchBar: "Search bar",
  NavbarBlock: "Navbar",
};
