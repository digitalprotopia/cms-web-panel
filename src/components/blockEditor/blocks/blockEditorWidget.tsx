import { gql, useQuery } from '@apollo/client';
import { BlockNoteEditor, defaultProps, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Menu } from '@mantine/core';
import { WidgetsOutlined } from '@mui/icons-material';
import Link from 'next/link';

import { IWidgetGraphQL as IWidget } from '../../entities/IWidget';
// eslint-disable-next-line import/no-cycle
import { PageWidget } from '../../ParseWidgets';
import { BlockSettings } from '../../BlockEditor';

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

      const current_widget = snippets.data?.getAllWidgets?.find(
        (w: IWidget) => w.name === props.block.props.type,
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
                        {current_widget?.title || 'Выберите виджет'}
                      </Menu.Item>
                    </div>
                  </Menu.Target>
                  {/* Dropdown to change the Widget type */}
                  <Menu.Dropdown>
                    <Menu.Label>Виджет</Menu.Label>
                    {current_widget
                      ? <Menu.Divider />
                      : null}
                    {current_widget
                      ? (
                        <Menu.Item
                          component={Link}
                          href={`/admin/widgets/${current_widget.id}`}
                        >
                          Редактировать
                        </Menu.Item>
                      )
                      : null}
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
