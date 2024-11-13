import { Config } from './config.sample';

const config: Config = {
  server: process.env.NEXT_PUBLIC_S3APP_LICENSE_REPOSITORY_SERVER || '',
  noConfirmation: !!process.env.NEXT_PUBLIC_S3APP_LICENSE_REPOSITORY_NO_CONFIRMATION || false,
};
console.log(config);

export default config;
