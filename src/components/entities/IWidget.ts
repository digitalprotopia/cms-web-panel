import { IEntity } from './IEntity';

export enum WidgetViewType {
  LIST = 'list',
  MAP = 'map',
  // SINGLE = 'single',
  STATIC = 'static',
  // CALENDAR = 'calendar',
}

export interface IWidget extends IEntity {
  title: string;
  name: string;
  tableViewId: string;
  templateId: string;
  cssClass: string;
  // height: number
  // TODO: Доступы
}
