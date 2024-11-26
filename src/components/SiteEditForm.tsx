import textField from '@/components/guiElements/TextField';
import { ITemplateGroup } from '@/components/entities/ITemplateGroup';
import S3Autocomplete from '@/components/guiElements/S3Autocomplete';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Button,
} from '@mui/material';
import { GET_TEMPLATE_GROUPS } from '@/pages/admin/templateGroups';
import { SiteFormData } from './entities/ISite';

export default function SiteEditForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<SiteFormData>;
  onSubmit: (data: SiteFormData) => void;
  onCancel: () => void;
}) {
  const {
    id = '', title = '', templateGroupId = null, favicon = '', domain = '', platformId = undefined,
  } = initialData;
  const [formData, setFormData] = useState<SiteFormData>({
    id, title, favicon, domain, templateGroupId, platformId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const templateGroups: ITemplateGroup[] = useQuery(GET_TEMPLATE_GROUPS).data?.getTemplateGroups;

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {textField('Заголовок', formData.title, (e) => setFormData({ ...formData, title: e.target.value }))}
        {textField('Домен', formData.domain, (e) => setFormData({ ...formData, domain: e.target.value }))}
        <div className="grid grid-cols-2 gap-4">
          <S3Autocomplete
            value={formData.templateGroupId}
            options={templateGroups}
            label="Шаблоны сайта"
            variant="outlined"
            onChange={(e) => setFormData({
              ...formData,
              templateGroupId: typeof e === 'string' || e === null ? e : e[0],
            })}
          />
          <Button variant="outlined" disabled={!formData.templateGroupId} href={`/admin/templateGroups/${formData.templateGroupId}`}>Редактировать</Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outlined" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="contained" type="submit">
          {initialData.id ? 'Обновить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
}
