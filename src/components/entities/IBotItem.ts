import { IEntity } from './IEntity';

export enum BotItemType {
  Static = 'static',
  List = 'list',
  Single = 'single',
  FormAdd = 'formAdd',
  FormSearch = 'formSearch',
}

export interface IBotItem extends IEntity {
  id: string
  isStart: boolean
  title: string
  content: string
  filterScript?: string
  type: BotItemType
  tableViewId: string
  tableRowId: string
  botId: string
  fileId: string | null
  formId: string
  isCustomGraphql: boolean
  customGraphql: string
}
