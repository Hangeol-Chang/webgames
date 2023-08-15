/** @type {import('next').NextConfig} */
const debug = process.env.NODE_ENV !== "production";
const repository = "https://hangeol-chang.github.io/webgames";

const nextConfig = {
    output: 'export',
    reactStrictMode: false,
    assetPrefix: !debug ? `${repository}/` : "/", 
    trailingSlash: true,
    
    env: {
        BASE_URL: process.env.BASE_URL,
    },
    
    images: {
        loader: 'akamai',
        path: '/',
        unoptimized : true
    }
}

module.exports = nextConfig
