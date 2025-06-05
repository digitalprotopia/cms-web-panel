import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Editor } from '@monaco-editor/react';
import { Css } from '@mui/icons-material';
import Head from 'next/head';

export const BlockEditorCssView = createReactBlockSpec(
  {
    type: 'css-view',
    propSchema: {
      css: {
        default: '',
        type: 'string',
      },
    },
    content: 'none',
    isSelectable: false,
  },
  {
    render: (props) => (props.editor.isEditable
      ? (
        <div data-widget-type="css-view">
          <div>CSS</div>
          <div>
            <Editor
              height={200}
              width={800}
              defaultLanguage="css"
              defaultValue={props.block.props.css}
              onChange={(value) => {
                props.editor.updateBlock(props.block, {
                  type: 'css-view',
                  props: { css: value },
                });
              }}
            />
          </div>
        </div>
      )
      : (
        <Head>
          <style dangerouslySetInnerHTML={{ __html: props.block.props.css }} />
        </Head>
      )
    ),
  },
);

export const insertBlockEditorCssView = (editor: BlockNoteEditor) => (
  {
    title: 'CSS блок',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'css-view' as any,
        props: {
        } as any,
      });
    },
    aliases: [
      'css-view',
    ],
    group: 'Базовые блоки',
    icon: <Css />,
  }
);
