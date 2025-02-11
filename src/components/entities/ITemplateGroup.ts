import { IEntity } from './IEntity';

export enum TemplateGroupType {
  TEXT = 'text',
  BLOCKS = 'blocks',
}

export interface ITemplateGroup extends IEntity {
  title: string;
  isMultiple: boolean;
  type: TemplateGroupType;
}
