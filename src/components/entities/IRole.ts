import { IEntity } from './IEntity';

export interface IRole extends IEntity {
  name: string;
  title: string;
  isSystem: boolean;
  isDeleted: boolean;
}
