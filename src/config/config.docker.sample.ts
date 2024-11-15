import { Config } from './config.sample';

async function config(): Promise<Config> {
  const data = await (await fetch('/config.json')).json();
  return data;
}
console.log(config);

export default config;
