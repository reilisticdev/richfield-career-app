/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // ONLY proxy to the local Python server when running on your laptop
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:5000/api/:path*',
        },
      ];
    }
    // In production, let vercel.json handle the routing to app.py
    return [];
  },
};

export default nextConfig;