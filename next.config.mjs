import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  devIndicators: false,
  reactStrictMode: true,
  trailingSlash: true,
};

export default withMDX(nextConfig);
