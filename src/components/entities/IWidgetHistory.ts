import { IEntity } from './IEntity';
import { TemplateLanguage } from './ITemplate';
import { WidgetViewType } from './IWidget';

export interface IWidgetHistory extends IEntity {
  widgetId: string;
  name: string;
  title: string;
  widgetViewType: WidgetViewType;
  tableId: string;
  markup: string;
  markupLanguage: TemplateLanguage;
  style: string;
  cssClass: string;
}
