import { IEntity } from './IEntity';
import { IPrivilege } from './IPrivilege';

export interface IRole extends IEntity {
  name: string;
  title: string;
  isSystem: boolean;
  privileges?: IPrivilege[];
}
