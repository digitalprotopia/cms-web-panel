import { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import HistoryIcon from '@mui/icons-material/History';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import WidgetHistoryDialog from './dialogs/WidgetHistoryDialog';
import { ISiteItem } from './entities/ISiteItem';
import { TemplateLanguage } from './entities/ITemplate';
import { IWidgetData, WidgetViewType } from './entities/IWidget';

import WidgetSettings from './WidgetSettings';

export const GET_TABLES = gql`
  query {
    getTables {
      id
      name
      dbName
      createdAt
    }
  }
`;

const GET_WIDGET = gql`
  query GetWidget($id: ID!) {
    getWidget(id: $id) {
      id
      name
      title
      cssClass
      createdAt
      widgetViewType
      tableView {
        table {
          id
          name
          dbName
          createdAt
        }
      }
      template {
        id
        html
        language
        css
      }
      siteItems {
        id,
        title,
        site {
          id
        }
      }
    }
  }
`;

const CREATE_WIDGET = gql`
  mutation CreateWidget(
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    createWidget(
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

const UPDATE_WIDGET = gql`
  mutation EditWidget(
    $id: ID!
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    editWidget(
      id: $id
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

interface WidgetAddEditPageProps {
  id?: string;
  onClose: () => void;
}

// Используется не ISiteItem, т.к. в SiteItem url неявно это имя последнего
//  сегмента пути (path), а в IUsingPage urlPath это весь url путь (path).
interface IUsingPage {
  title: string,
  urlPath: string,
}

// Ссылки на страницы которые используют виждет.
function PageLinks({ usingPages }: { usingPages: IUsingPage[] }) {
  const pageLinks = usingPages.map(({ title, urlPath }, index) => (
    <Box>
      <Link
        key={index}
        href={urlPath}
        target="_blank"
        rel="noopener noreferrer"
      >
        {title}
      </Link>
    </Box>
  ));

  return (
    <div>
      {
        pageLinks.length === 0
          ? <Typography component="span">Не используется на страницах</Typography>
          : (
            <Accordion>
              <AccordionSummary
                expandIcon={<ArrowDropDownIcon />}
                aria-controls="using-pages-content"
                id="using-pages-header"
              >
                <Typography component="span">Используется на страницах</Typography>
              </AccordionSummary>
              <AccordionDetails>{ pageLinks }</AccordionDetails>
            </Accordion>
          )
      }
    </div>
  );
}

// Добавить новый виджет если id не передан.
// Изменить виджет если id передан.
function WidgetAddEditPage({ id, onClose }: WidgetAddEditPageProps) {
  const [widgetData, setWidgetData] = useState<IWidgetData>({
    name: '',
    title: '',
    widgetViewType: WidgetViewType.LIST,
    tableId: '',
    markup: '',
    markupLanguage: TemplateLanguage.SIMPLE,
    style: '',
    cssClass: '',
  });
  // ID версии виджета (из истории) из которого виджет восстановлен.
  const [restoredVersionId, setRestoredVersionId] = useState<string | null>(null);
  // Отредактирован ли открытый либо восстановленный из истории виждет.
  const [isEdited, setIsEdited] = useState<boolean>(false);

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [usingPages, setUsingPages] = useState<IUsingPage[]>([]);

  const isEditMode = !!id;

  const { loading: widgetLoading } = useQuery(GET_WIDGET, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      // Обновить данные виджета.
      setWidgetData({
        name: data.getWidget.name,
        title: data.getWidget.title,
        widgetViewType: data.getWidget.widgetViewType,
        tableId: data.getWidget.tableView.table?.id,
        markup: data.getWidget.template.html,
        markupLanguage: data.getWidget.template.language,
        style: data.getWidget.template.css,
        cssClass: data.getWidget.cssClass,
      });

      // Обновить данные страниц использующих виджет.
      setUsingPages(data.getWidget.siteItems.map(
        (siteItem: ISiteItem): IUsingPage => ({
          title: siteItem.title,
          urlPath: `/admin/sites/${siteItem.site.id}/pages/${siteItem.id}`,
        }),
      ));
    },
  });

  const { data: tablesData, loading: tablesLoading } = useQuery(GET_TABLES);

  const [createWidget] = useMutation(CREATE_WIDGET);
  const [updateWidget] = useMutation(UPDATE_WIDGET);

  if ((isEditMode && widgetLoading && tablesLoading) || tablesLoading) {
    return <div>Loading...</div>;
  }

  const handleSave = () => {
    const variables = {
      input: {
        name: widgetData.name,
        title: widgetData.title,
        widgetViewType: widgetData.widgetViewType,
        cssClass: widgetData.cssClass,
      },
      tableView: {
        title: widgetData.title,
        name: widgetData.name,
        tableId: widgetData.tableId,
      },
      template: {
        title: widgetData.title,
        html: widgetData.markup,
        language: widgetData.markupLanguage,
        css: widgetData.style,
      },
    };

    if (isEditMode) {
      updateWidget({ variables: { id, ...variables } }).then(() => {
        onClose();
      });
    } else {
      createWidget({ variables }).then(() => {
        onClose();
      });
    }
  };

  return (
    <>
      <div className="rounded p-4 shadow-lg bg-white overflow-y-auto">
        {/* Заголовок */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            { isEditMode ? 'Редактировать виджет' : 'Добавить виджет'}
          </Typography>
          {isEditMode && (
            <IconButton
              color="secondary"
              aria-label="История изменений"
              onClick={() => setIsHistoryDialogOpen(true)}
              sx={{
                color: 'black',
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.1)',
                },
              }}
            >
              <HistoryIcon />
            </IconButton>
          )}
        </Stack>

        <div className="flex flex-col gap-4 py-2">
          {/* Настройки виджета */}
          <WidgetSettings
            widgetId={id}
            widgetData={widgetData}
            setWidgetData={setWidgetData}
            tables={tablesData?.getTables}
            onChangeSettings={() => setIsEdited(true)}
          />

          {/* Страницы использующие виджет */}
          <PageLinks
            usingPages={usingPages}
          />

          {/* Панель кнопок */}
          <div className="flex gap-4">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={
                !widgetData.name || !widgetData.title! || !widgetData.markup
                // || (widgetData.widgetViewType !== WidgetViewType.STATIC && !widgetData.tableId)
              }
            >
              {isEditMode ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="contained" onClick={onClose}>Отмена</Button>
          </div>
        </div>
      </div>

      {/* Если виджет редактируется, а не новый, то диалог восстановления виждета из истории */}
      {isEditMode && (
        <WidgetHistoryDialog
          isOpen={isHistoryDialogOpen}
          widgetId={id as string}
          tables={tablesData?.getTables}
          tablesLoading={tablesLoading}
          onClose={() => setIsHistoryDialogOpen(false)}
          setWidgetData={setWidgetData}
          restoredVersionId={restoredVersionId}
          setRestoredVersionId={setRestoredVersionId}
          onRestoreVersion={() => { setIsEdited(false); }}
          isEdited={isEdited}
        />
      )}
    </>
  );
}

export default WidgetAddEditPage;
