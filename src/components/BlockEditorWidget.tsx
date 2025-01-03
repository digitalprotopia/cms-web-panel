import { gql, useQuery } from '@apollo/client';
import { BlockNoteEditor, defaultProps, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Menu } from '@mantine/core';
import {
  MdCancel, MdCheckCircle, MdError, MdInfo,
} from 'react-icons/md';
import { RiAlertFill } from 'react-icons/ri';
import { IWidget } from './entities/IWidget';
import { PageWidget } from './ParsePage';

// The Widget block.
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
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const snippets = useQuery(gql`
            query {
            getAllWidgets {
            id
            name
            title
            createdAt
            }
            getAllForms {
            id
            name
            title
            createdAt
            }
            }`);

      return (
        <div className="widget" data-widget-type={props.block.props.type}>
          {/* Icon which opens a menu to choose the Widget type */}
          {props.editor.isEditable
            ? (
              <Menu withinPortal={false}>
                <Menu.Target>
                  <div className="widget-icon-wrapper" contentEditable={false}>
                    {snippets.data?.getAllWidgets?.find((w: IWidget) => w.name === props.block.props.type)?.title || 'select type'}
                  </div>
                </Menu.Target>
                {/* Dropdown to change the Widget type */}
                <Menu.Dropdown>
                  <Menu.Label>Widget Type</Menu.Label>
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
            )
            : null}
          <div>
            {props.block.props.type ? <PageWidget widgetName={props.block.props.type} /> : null}
          </div>
        </div>
      );
    },
  },
);

export const insertBlockEditorWidget = (editor: BlockNoteEditor) => ({
  title: 'BlockEditorWidget',
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: 'widget' as any,
    });
  },
  aliases: [
    'widget',
  ],
  group: 'Other',
  icon: <RiAlertFill />,
});
