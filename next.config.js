/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postgres'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  async headers(){
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value:'DENY',
          },
          {
            key:'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key:'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig