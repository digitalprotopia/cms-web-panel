import { IEntity } from './IEntity';

export interface ISession extends IEntity {
  id: string;
  userId: string;
  clientId: string;
  expireAt: Date;
}
