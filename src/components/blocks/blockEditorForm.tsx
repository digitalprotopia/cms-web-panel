import { BlockNoteEditor, defaultProps, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { gql, useQuery } from '@apollo/client';
import { Menu } from '@mantine/core';
import { DashboardOutlined } from '@mui/icons-material';
import { IForm } from '../entities/IForm';
import { FormWidget } from '../ParseWidgets';
import { BlockSettings } from '../BlockEditor';

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

export const insertBlockEditorForms = (editor: BlockNoteEditor, widgets: IForm[]) => (
  widgets.map((form) => ({
    title: form.title,
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'form' as any,
        props: {
          type: form.name,
        } as any,
      });
    },
    aliases: [
      form.name,
    ],
    group: 'Формы',
    icon: <DashboardOutlined />,
  })));
