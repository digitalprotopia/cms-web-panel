import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Editor } from '@monaco-editor/react';
import { Code } from '@mui/icons-material';
import Head from 'next/head';
import parse from 'html-react-parser';
import { useMemo } from 'react';

export const BlockEditorHeadView = createReactBlockSpec(
  {
    type: 'head-view',
    propSchema: {
      head: {
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
      const head = useMemo(() => parse(props.block.props.head), [props.block.props.head]);

      return props.editor.isEditable
        ? (
          <div data-widget-type="head-view">
            <div>Head</div>
            <div>
              <Editor
                height={200}
                width={800}
                defaultLanguage="html"
                defaultValue={props.block.props.head}
                onChange={(value) => {
                  props.editor.updateBlock(props.block, {
                    type: 'head-view',
                    props: { head: value },
                  });
                }}
              />
            </div>
          </div>
        )
        : (
          <Head>
            {head}
          </Head>
        );
    },
  },
);

export const insertBlockEditorHeadView = (editor: BlockNoteEditor) => (
  {
    title: 'Head блок',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'head-view' as any,
        props: {
        } as any,
      });
    },
    aliases: [
      'Head-view',
    ],
    group: 'Базовые блоки',
    icon: <Code />,
  }
);
