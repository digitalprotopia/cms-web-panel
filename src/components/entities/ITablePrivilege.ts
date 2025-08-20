import { IEntity } from './IEntity';

export enum Privilege {
  READ = 'read',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

export interface ITablePrivilege extends IEntity {
  tableId: string;
  roleId: string;
  privilege: Privilege;
  onlyCreator: boolean;
}
