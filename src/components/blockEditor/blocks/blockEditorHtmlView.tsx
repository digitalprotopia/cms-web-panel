import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Editor } from '@monaco-editor/react';
import { Html, Visibility } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useState } from 'react';

const BlockEditorHtmlView = createReactBlockSpec(
  {
    type: 'html-view',
    propSchema: {
      html: {
        default: '',
        type: 'string',
      },
    },
    content: 'none',
    isSelectable: false,
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [isShow, setIsShow] = useState(false);

      return (
        <div data-widget-type="html-view">
          <div>
            {props.editor.isEditable ? (
              <div>
                <IconButton
                  onClick={() => setIsShow(!isShow)}
                >
                  <Visibility />
                </IconButton>
              </div>
            ) : null}
            {(props.editor.isEditable && !isShow)
              ? (
                <div>
                  <Editor
                    height={200}
                    width={800}
                    defaultLanguage="html"
                    defaultValue={props.block.props.html}
                    onChange={(value) => {
                      props.editor.updateBlock(props.block, {
                        type: 'html-view',
                        props: { html: value },
                      });
                    }}
                  />
                </div>
              )
              : (
                <div dangerouslySetInnerHTML={{ __html: props.block.props.html }} />
              )}
          </div>
        </div>
      );
    },
  },
);

export const insertBlockEditorHtmlView = (editor: BlockNoteEditor) => (
  {
    title: 'HTML блок',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'html-view' as any,
        props: {
        } as any,
      });
    },
    aliases: [
      'html-view',
    ],
    group: 'Базовые блоки',
    icon: <Html />,
  }
);

export default BlockEditorHtmlView;
