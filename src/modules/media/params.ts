import { createLoader } from "nuqs/server";

import { mediaSearchParams } from "./lib/media-search-params";

export { mediaSearchParams };

export const loadMediaSearchParams = createLoader(mediaSearchParams);
