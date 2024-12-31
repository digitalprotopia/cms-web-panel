import { IEntity } from './IEntity';
import { ISite } from './ISite';
import { ISiteMenuItem } from './ISiteMenuItem';

export interface ISiteMenu extends IEntity {
  name: string;
  title: string;
  items: ISiteMenuItem[];
  siteId: ISite['id'];
}
