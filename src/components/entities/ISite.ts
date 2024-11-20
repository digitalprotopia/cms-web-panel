import { IEntity } from './IEntity';

export interface SiteFormData {
  id: string;
  title: string;
  favicon: string;
  domain: string;
  templateGroupId: string | null;
  platformId?: string;
}

export interface ISite extends IEntity, SiteFormData {}
