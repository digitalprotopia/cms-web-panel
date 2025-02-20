import { IEntity } from './IEntity';

export interface IBotTrigger extends IEntity {
  title: string;
  name: string;
  serverScriptId: string;
  enabled: boolean;
}