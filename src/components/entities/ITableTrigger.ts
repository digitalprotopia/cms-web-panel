import { IEntity } from './IEntity';

export enum TableTriggerType {
  BEFORE_CREATE = 'beforeCreate',
  AFTER_CREATE = 'afterCreate',
  BEFORE_EDIT = 'beforeEdit',
  AFTER_EDIT = 'afterEdit',
  BEFORE_DELETE = 'beforeDelete',
  AFTER_DELETE = 'afterDelete',
  FILTER = 'filter',
  QUERY_FILTER = 'queryFilter',
}

export interface ITableTrigger extends IEntity {
  title: string;
  name: string;
  type: TableTriggerType
  enabled: boolean;
  tableId: string;
  serverScriptId: string;
}
