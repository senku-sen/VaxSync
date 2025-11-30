/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: "/healthWorker/inventory",
        destination: "/app/pages/healthWorker/inventory"
      }
    ];
  },
};

export default nextConfig;
