import { IEntity } from './IEntity';

export interface ITableView extends IEntity {
  title: string;
  name: string;
  tableId: string;
  dataFilterId: string;
  // TODO: Доступы
}