/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Necessário para @react-pdf/renderer funcionar no servidor
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}

module.exports = nextConfig
