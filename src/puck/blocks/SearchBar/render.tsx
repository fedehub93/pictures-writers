import type { PuckComponent } from "@puckeditor/core";

import { SearchBox } from "@/shared/components/search/search-box";

import type { SearchBarBlockProps } from "./types";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * It deliberately imports only the search UI so the public render path never
 * pulls in editor field modules.
 */
export const renderSearchBarBlock: PuckComponent<SearchBarBlockProps> = ({
  placeholder,
  variant,
}) => <SearchBox placeholder={placeholder} variant={variant} />;
