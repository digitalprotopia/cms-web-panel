import getConfig from 'next/config';
import { Config } from './config.sample';

const { publicRuntimeConfig } = getConfig();

const config: Config = {
  server: publicRuntimeConfig.server || '',
  noConfirmation: publicRuntimeConfig.noConfirmation || false,
};
console.log(config);

export default config;
