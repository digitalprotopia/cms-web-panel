import { IEntity } from './IEntity';
import { IRole } from './IRole';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface IUser extends IEntity {
  _id: string;
  id: string;
  name: string;
  email: string;
  password?: string;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  confirmEmail?: string;
  confirmEmailExpires?: Date;
  confirmEmailCode?: string;
  role: IRole;
}
