import createMDX from "@next/mdx";

const withMDX = createMDX({});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  trailingSlash: true,
};

export default withMDX(nextConfig);

