import { IEntity } from './IEntity';

export interface IWidget extends IEntity {
  title: string;
  name: string;
  tableViewId: string;
  templateId: string;
  // TODO: Доступы
}
