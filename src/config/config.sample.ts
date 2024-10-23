export interface Config {
  server: string;
  noConfirmation?: boolean;
}

const config: Config = {
  server: process.env.NEXT_PUBLIC_S3APP_LICENSE_REPOSITORY_SERVER || "",
};

export default config;
