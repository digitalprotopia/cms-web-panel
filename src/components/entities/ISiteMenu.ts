import { IEntity } from './IEntity';
import { ISiteMenuItem } from './ISiteMenuItem';

export interface ISiteMenu extends IEntity {
  name: string;
  title: string;
  siteId?: string;
  items: ISiteMenuItem[];
}
