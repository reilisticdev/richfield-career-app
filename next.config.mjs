/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only proxy to the local Python server when running on your laptop
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:5000/api/:path*', 
        },
      ];
    }
    // In production, return nothing so Vercel uses the vercel.json routes
    return [];
  }
};

export default nextConfig;