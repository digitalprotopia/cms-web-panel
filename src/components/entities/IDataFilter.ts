import { IEntity } from './IEntity';

export interface IDataFilter extends IEntity {
  fields?: string;
  limit?: number;
  order?: string;
  conditions?: string;
}
