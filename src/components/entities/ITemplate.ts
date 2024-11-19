import { IEntity } from './IEntity';

export interface ITemplateFormData {
  name: string;
  title: string;
  templateGroupId: string | null | undefined;
  html: string;
  css: string;
}

export interface ITemplate extends IEntity, ITemplateFormData {
  isMultiple: boolean;
}
