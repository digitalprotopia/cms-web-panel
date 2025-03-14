import { gql, useQuery } from '@apollo/client';
import { BlockNoteEditor, CustomBlockConfig, defaultProps, InlineContentSchema, insertOrUpdateBlock, StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, ReactCustomBlockRenderProps } from '@blocknote/react';
import { Menu } from '@mantine/core';
import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import { MoreVert, WidgetsOutlined } from '@mui/icons-material';
import { IWidget } from '../entities/IWidget';
import { FormWidget, PageWidget } from '../ParseWidgets';
import { IForm } from '../entities/IForm';

export const insertBlockEditorWidgets = (editor: BlockNoteEditor, widgets: IWidget[]) => (
  widgets.map((widget) => ({
    title: widget.title,
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'widget' as any,
        props: {
          type: widget.name,
        } as any,
      });
    },
    aliases: [
      widget.name,
    ],
    group: 'Виджеты',
    icon: <WidgetsOutlined />,
  })));

function BlockSettings(
  props: ReactCustomBlockRenderProps<CustomBlockConfig & any, InlineContentSchema, StyleSchema>,
) {
  const [dialog, setDialog] = useState(false);

  return (
    <>
      <IconButton
        size="small"
        onClick={() => {
          setDialog(true);
        }}
      >
        <MoreVert />
      </IconButton>
      <Dialog open={dialog} onClose={() => setDialog(false)}>
        <DialogTitle>Настройки блока</DialogTitle>
        <DialogContent>
          <TextField
            title="CSS class"
            label="CSS class"
            value={props.block.props.cssClass}
            onChange={(e) => {
              props.editor.updateBlock(props.block, {
                props: { cssClass: e.target.value },
              });
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Закрыть</Button>
        </DialogActions>

      </Dialog>
    </>
  );
}

export const BlockEditorWidget = createReactBlockSpec(
  {
    type: 'widget',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        type: 'string',
        default: '',
      },
      cssClass: {
        type: 'string',
        default: '',
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const snippets = useQuery(
        gql`
              query {
              getAllWidgets {
              id
              name
              title
              createdAt
              }
              }`,
        { skip: !props.editor.isEditable },
      );

      return (
        <div className={props.editor.isEditable ? 'widget' : 'widget-view'} data-widget-type={props.block.props.type}>
          {/* Icon which opens a menu to choose the Widget type */}
          {props.editor.isEditable
            ? (
              <>
                <Menu withinPortal={false}>
                  <Menu.Target>
                    <div contentEditable={false}>
                      <Menu.Item>
                        {snippets.data?.getAllWidgets?.find((w: IWidget) => w.name === props.block.props.type)?.title || 'Выберете виджет'}
                      </Menu.Item>
                    </div>
                  </Menu.Target>
                  {/* Dropdown to change the Widget type */}
                  <Menu.Dropdown>
                    <Menu.Label>Виджет</Menu.Label>
                    <Menu.Divider />
                    {(snippets.data?.getAllWidgets || []).map((widget: IWidget) => (
                      <Menu.Item
                        key={widget.name}
                        onClick={() => props.editor.updateBlock(props.block, {
                          type: 'widget',
                          props: { type: widget.name },
                        })}
                      >
                        {widget.title}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
                <BlockSettings {...props} />
              </>
            )
            : null}
          <div
            style={{
              flex: 1,
              pointerEvents: props.editor.isEditable ? 'none' : undefined,
            }}
            className={props.block.props.cssClass || undefined}
          >
            {props.block.props.type ? <PageWidget widgetName={props.block.props.type} /> : null}
          </div>
        </div>
      );
    },
  },
);

export const BlockEditorForm = createReactBlockSpec(
  {
    type: 'form',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        type: 'string',
        default: '',
      },
      cssClass: {
        type: 'string',
        default: '',
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const snippets = useQuery(
        gql`
              query {
              getAllForms {
              id
              name
              title
              createdAt
              }
              }`,
        { skip: !props.editor.isEditable },
      );

      return (
        <div className={props.editor.isEditable ? 'widget' : 'widget-view'} data-widget-type={props.block.props.type}>
          {/* Icon which opens a menu to choose the Widget type */}
          {props.editor.isEditable
            ? (
              <>
                <Menu withinPortal={false}>
                  <Menu.Target>
                    <div contentEditable={false}>
                      <Menu.Item>
                        {snippets.data?.getAllForms?.find((f: IForm) => f.name === props.block.props.type)?.title || 'Выберете форму'}
                      </Menu.Item>
                    </div>
                  </Menu.Target>
                  {/* Dropdown to change the Widget type */}
                  <Menu.Dropdown>
                    <Menu.Label>Виджет</Menu.Label>
                    <Menu.Divider />
                    {(snippets.data?.getAllForms || []).map((form: IForm) => (
                      <Menu.Item
                        key={form.name}
                        onClick={() => props.editor.updateBlock(props.block, {
                          type: 'form',
                          props: { type: form.name },
                        })}
                      >
                        {form.title}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
                <BlockSettings {...props} />
              </>
            )
            : null}
          <div style={{ flex: 1 }} className={props.block.props.cssClass || undefined}>
            {props.block.props.type ? <FormWidget formName={props.block.props.type} /> : null}
          </div>
        </div>
      );
    },
  },
);
