/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  // Usuários ficam no Portal (cadastro central de pessoas).
  async redirects() {
    return [
      { source: "/admin/usuarios/:path*", destination: "https://sistemas.casaforteinc.com.br/pessoas", permanent: false },
    ];
  },
};

module.exports = nextConfig;
