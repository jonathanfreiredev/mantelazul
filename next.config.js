/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/ddjovluur/**",
      },
    ],
  },
  // The legal pages read their markdown from `src/content/legal` while rendering, which the tracer
  // cannot see through. Without this the deployed function would not carry the files.
  outputFileTracingIncludes: {
    "/*": ["src/content/legal/**/*.md"],
  },
};

export default withNextIntl(config);
