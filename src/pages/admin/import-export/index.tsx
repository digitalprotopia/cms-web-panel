import { useState } from 'react';
import Head from 'next/head';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';

import WidgetExport from '@/components/import-export/WidgetExport';
import WidgetImport from '@/components/import-export/WidgetImport';
import { IWidgetExportData } from '@/components/entities/IWidget';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ImportExportPage() {
  const [tabValue, setTabValue] = useState(0);
  const [exportEntityType, setExportEntityType] = useState('widgets');
  const [importStatus, setImportStatus] = useState<{
    type: 'error' | 'info' | 'success', message: string
  } | null>(null);
  const [importedJson, setImportedJson] = useState<{
    entityType: string, data: unknown[]
  } | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = event.target.files?.[0];
    if (!file) {
      setImportedJson(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.entityType || !Array.isArray(json.data)) {
          setImportStatus({ type: 'error', message: 'Неверный формат файла. Отсутствует entityType или data не является массивом.' });
          setImportedJson(null);
          return;
        }
        setImportedJson(json);
        setImportStatus({ type: 'info', message: `Файл загружен. Тип сущности: ${json.entityType}` });
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Ошибка чтения файла: неверный JSON формат' });
        setImportedJson(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Head>
        <title>Импорт / Экспорт</title>
      </Head>
      <div className="flex items-center justify-between gap-4 mb-4">
        <Typography variant="h4">Импорт / Экспорт</Typography>
      </div>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Экспорт" />
            <Tab label="Импорт" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <FormControl sx={{ minWidth: 200, mb: 4 }}>
            <InputLabel>Тип сущности</InputLabel>
            <Select
              value={exportEntityType}
              label="Тип сущности"
              onChange={(e) => setExportEntityType(e.target.value)}
            >
              <MenuItem value="widgets">Виджет</MenuItem>
            </Select>
          </FormControl>

          {exportEntityType === 'widgets' && <WidgetExport />}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" mb={2}>Загрузите файл</Typography>

          <Box mb={3}>
            <input
              accept=".json"
              type="file"
              onChange={handleFileUpload}
            />
          </Box>

          {importStatus && (
            <Alert severity={importStatus.type} sx={{ mb: 2 }}>
              {importStatus.message}
            </Alert>
          )}

          {importedJson && importedJson.entityType === 'widgets' && (
            <WidgetImport
              data={importedJson.data as IWidgetExportData[]}
              onImportSuccess={() => setImportedJson(null)}
            />
          )}
        </TabPanel>
      </Box>
    </div>
  );
}
