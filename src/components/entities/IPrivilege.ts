import { IEntity } from './IEntity';

export enum PrivilegeType {
  POSTS = 'posts',
}

export interface IPrivilege extends IEntity {
  roleId: string;
  privilege: PrivilegeType;
}