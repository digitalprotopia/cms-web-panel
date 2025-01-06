import { IEntity } from './IEntity';

export interface IDataFilter extends IEntity {
  fields?: string;
  limit?: number;
  position?: string;
  conditions?: string;
}
