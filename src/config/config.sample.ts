export interface Config {
  server: string;
  noConfirmation?: boolean;
  yandexKey?: string;
}

async function config(): Promise<Config> {
  return {
    server: '',
    noConfirmation: false,
  };
}
console.log(config);

export default config;
