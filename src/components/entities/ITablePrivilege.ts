import { IEntity } from './IEntity';

export enum Role {
    ADMIN = 'admin',
    USER = 'user',
    GUEST = 'guest',
}

export enum Privilege {
    READ = 'read',
    CREATE = 'create',
    EDIT = 'edit',
    DELETE = 'delete',
}

export interface ITablePrivilege extends IEntity {
    tableId: string;
    roleId: string;
    privilege: Privilege[];
}