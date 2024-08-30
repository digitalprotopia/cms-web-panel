import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

const config = {
  server: publicRuntimeConfig.server || '',
};
console.log(config);

export default config;
