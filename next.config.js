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
  // The legal pages read their markdown from `src/content/legal` while rendering, and the social
  // card reads the logo, which the tracer cannot see through either. Without these the deployed
  // function would not carry the files.
  outputFileTracingIncludes: {
    "/*": ["src/content/legal/**/*.md", "public/logo-dark.png"],
  },
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
};

export default withNextIntl(config);
