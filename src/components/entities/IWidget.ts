import { IEntity } from './IEntity';

export enum WidgetViewType {
  LIST = 'list',
  MAP = 'map',
  // SINGLE = 'single',
  STATIC = 'static',
  // CALENDAR = 'calendar',
  HTML = 'html',
}

export interface IWidget extends IEntity {
  title: string;
  name: string;
  tableViewId: string;
  templateId: string;
  cssClass: string;
  // TODO: Доступы
}
