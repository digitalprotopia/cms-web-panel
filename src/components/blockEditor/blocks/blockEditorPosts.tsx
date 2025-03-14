import { createReactBlockSpec } from '@blocknote/react';
import { TextInput } from '@mantine/core';
import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { DashboardOutlined } from '@mui/icons-material';
import { Posts } from '../../BlockEditor';

export const BlockEditorPosts = createReactBlockSpec(
  {
    type: 'posts',
    propSchema: {
      urlPrefix: {
        default: '/posts/',
        type: 'string',
      },
    },
    content: 'none',
    isSelectable: false,
  },
  {
    render: (props) => (
      <div data-widget-type="posts" className="flex gap-2">
        {
              props.editor.isEditable && (
                <div>
                  <div>
                    <TextInput
                      size="small"
                      label="Префикс ссылки на посты"
                      value={props.block.props.urlPrefix}
                      onChange={(e) => {
                        props.editor.updateBlock(
                          props.block,
                          { props: {
                            ...props.block.props,
                            urlPrefix: e.target.value,
                          } },
                        );
                      }}
                    />
                  </div>
                </div>
              )
            }
        <div>
          {props.editor.isEditable
            ? (
              <div style={{ pointerEvents: 'none' }}>
                <Posts urlPrefix={props.block.props.urlPrefix} />
              </div>
            )
            : <Posts urlPrefix={props.block.props.urlPrefix} />}
        </div>
      </div>
    ),
  },
);

export const insertBlockEditorPosts = (editor: BlockNoteEditor) => (
  {
    title: 'Посты',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'posts' as any,
        props: {
          urlPrefix: '/posts/',
        } as any,
      });
    },
    aliases: [
      'posts',
    ],
    group: 'Посты',
    icon: <DashboardOutlined />,
  }
);
