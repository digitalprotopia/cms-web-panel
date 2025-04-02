import { IEntity } from './IEntity';

export enum Role {
    ADMIN = 'admin',
    USER = 'user',
    GUEST = 'guest',
}

export enum Privilege {
    READ = 'read',
    WRITE = 'write',
    FORBIDDEN = 'forbidden',
}

export interface IFieldPrivilege extends IEntity {
    fieldId: string;
    roleId: string;
    privilege: Privilege;
}