import { IEntity } from './IEntity';

export interface TemplateFormData {
  name: string;
  title: string;
  templateGroupId: string | null | undefined;
  html: string;
  css: string;
}

export interface ITemplate extends IEntity, TemplateFormData {
  isMultiple: boolean;
}
