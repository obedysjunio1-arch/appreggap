const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Desabilitar PWA em produção na Vercel se necessário
  buildExcludes: [/app-manifest\.json$/],
  // Configurações para Vercel
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  // Configurações adicionais para PWA
  sw: 'sw.js',
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  // Configuração para Vercel - usar standalone apenas se necessário
  // output: 'standalone', // Comentado para melhor compatibilidade com Vercel
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Configuração para evitar erros de pré-renderização
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configurações para Vercel
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
