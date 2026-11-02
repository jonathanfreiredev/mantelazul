import { cache } from "react";
import { headers } from "next/headers";
import { auth } from ".";

/**
 * The session for the current request. Cached so the header, the category bar and a page that all
 * need it share one database lookup instead of asking Better Auth three times.
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
