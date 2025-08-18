import { IEntity } from './IEntity';

export enum BotButtonType {
  BotItem = 'botItem',
  trigger = 'trigger',
  link = 'link',
}

export interface IBotButton extends IEntity {
  id: string
  botItemId: string
  title: string
  type: BotButtonType
  targetBotItemId?: string
  targetTriggerId?: string
  link?: string
}
