import { IEntity } from './IEntity';

export interface IBot extends IEntity {
  id: string;
  name: string;
  title: string;
  favicon: string;
  url: string;
  apiKey: string;
  platformID: string;
  idInPlatform: string;
  clientId: string;
}
