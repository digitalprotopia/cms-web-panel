import { IEntity } from './IEntity';

export interface ISite extends IEntity {
  name: string;
  title: string;
  favicon: string;
  url: string;
  templateId: string;
  platformId: string;
}
