import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import { IWidgetGraphQL, IWidgetExportData } from '@/components/entities/IWidget';

export const GET_ALL_WIDGETS = gql`
  query GetWidgetsForExport {
    getAllWidgets {
      id
      name
      title
      cssClass
      widgetViewType
      precompiled
      tableView {
        table {
          id
          name
        }
      }
      template {
        id
        html
        language
        css
      }
    }
  }
`;

export default function WidgetExport() {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  const { data, loading } = useQuery(GET_ALL_WIDGETS);

  const handleToggleSelect = (id: string) => {
    setSelectedWidgets((prev) => (
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    ));
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedWidgets(data?.getAllWidgets.map((w: IWidgetGraphQL) => w.id) || []);
    } else {
      setSelectedWidgets([]);
    }
  };

  const handleExport = () => {
    const widgetsToExport = data?.getAllWidgets.filter(
      (w: IWidgetGraphQL) => selectedWidgets.includes(w.id),
    );

    if (!widgetsToExport || widgetsToExport.length === 0) return;

    const exportData: IWidgetExportData[] = widgetsToExport.map((w: IWidgetGraphQL) => ({
      name: w.name,
      title: w.title,
      widgetViewType: w.widgetViewType,
      cssClass: w.cssClass,
      precompiled: w.precompiled || '',
      tableId: w.tableView?.table?.id || '',
      tableName: w.tableView?.table?.name || '',
      markup: w.template?.html || '',
      markupLanguage: w.template?.language || 'simple',
      style: w.template?.css || '',
    }));

    const exportPayload = {
      entityType: 'widgets',
      data: exportData,
    };

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportPayload, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'widgets_export.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  const existingWidgets = data?.getAllWidgets || [];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6">Выберите виджеты для экспорта</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
          disabled={selectedWidgets.length === 0}
        >
          Экспортировать выбранные (
          {selectedWidgets.length}
          )
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={handleSelectAll}
                  checked={
                    existingWidgets.length > 0
                    && selectedWidgets.length === existingWidgets.length
                  }
                  indeterminate={
                    selectedWidgets.length > 0
                    && selectedWidgets.length < existingWidgets.length
                  }
                />
              </TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Заголовок</TableCell>
              <TableCell>Тип</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {existingWidgets.map((widget: IWidgetGraphQL) => (
              <TableRow key={widget.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedWidgets.includes(widget.id)}
                    onChange={() => handleToggleSelect(widget.id)}
                  />
                </TableCell>
                <TableCell>{widget.name}</TableCell>
                <TableCell>{widget.title}</TableCell>
                <TableCell>{widget.widgetViewType}</TableCell>
              </TableRow>
            ))}
            {existingWidgets.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Виджеты не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
