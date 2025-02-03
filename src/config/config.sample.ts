export interface Config {
  server: string;
  domain: string;
  noConfirmation?: boolean;
  yandexKey?: string;
}

async function config(): Promise<Config> {
  return {
    server: '',
    noConfirmation: false,
    domain: 'example.com',
  };
}
console.log(config);

export default config;
