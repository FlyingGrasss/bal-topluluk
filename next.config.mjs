/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const apiOrigin = (
      process.env.API_URL?.trim() || "http://127.0.0.1:4600"
    ).replace(/\/+$/u, "");

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
