import { IEntity } from './IEntity';

export interface SiteFormData {
  id: string;
  name?: string;
  title: string;
  favicon: string;
  url: string;
  templateGroupId: string | null;
  platformId?: string;
}

export interface ISite extends IEntity, SiteFormData {}
