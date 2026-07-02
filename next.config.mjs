/** @type {import('next').NextConfig} */
const nextConfig = {
  // Saída standalone para imagem Docker enxuta (ver Dockerfile).
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    // Server Actions já são estáveis no Next 15; limites de upload para importação de arquivos.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
