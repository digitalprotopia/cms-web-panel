import { IEntity } from './IEntity';
import { TemplateLanguage } from './ITemplate';

export enum WidgetViewType {
  LIST = 'list',
  MAP = 'map',
  // SINGLE = 'single',
  STATIC = 'static',
  // CALENDAR = 'calendar',
}

// Это устаревший интерфейс со времен когда template предпологалось
//   использоваться для всего. Оставлен до изменения схемы GraphQL.
export interface IWidgetGraphQL extends IEntity {
  title: string;
  name: string;
  tableViewId: string;
  templateId: string;
  cssClass: string;
  // TODO: Доступы
}

export interface IWidgetData {
  name: string;
  title: string;
  widgetViewType: WidgetViewType;
  tableId: string;
  markup: string;
  markupLanguage: TemplateLanguage;
  style: string;
  cssClass: string;
}

export interface IWidget extends IWidgetData, IEntity {}
