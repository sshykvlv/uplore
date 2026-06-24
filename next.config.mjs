/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep better-sqlite3 as a server-only external package (native module)
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}

export default nextConfig
