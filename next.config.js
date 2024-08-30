// const removeImports = require('next-remove-imports')();
/** @type {import('next').NextConfig} */

module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    // eslint-disable-next-line no-param-reassign
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  reactStrictMode: true,
  transpilePackages: ['mui-color-input', '@mdxeditor/editor', 'mui-tel-input'],
  publicRuntimeConfig: {
    server: process.env.S3APP_LICENSE_REPOSITORY_SERVER,
  },
};
