// eslint-disable-next-line import/no-cycle
import { BlockView } from '@/components/BlockEditor';
import ParsePage from '@/components/ParsePage';
import UserContext from '@/components/UserContext';
import { gql, useQuery } from '@apollo/client';
import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Editor } from '@monaco-editor/react';
import { Article } from '@mui/icons-material';
import { Box } from '@mui/material';
import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';

const GET_SITEITEM = gql`
  query GetSiteItem($id: ID!) {
    getSiteItem(id: $id) {
      url
      title
      html
      blockContent
      preview
      id
    }
  }
`;

export const BlockEditorContentView = createReactBlockSpec(
  {
    type: 'content-view',
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
      const user = useContext(UserContext);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [loaded, setLoaded] = useState(false);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        setTimeout(() => {
          setLoaded(true);
        }, 6000);
      });

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data: siteItem, loading } = useQuery(
        GET_SITEITEM,
        {
          variables: { id: user.currentPage?.id },
          skip: !user || props.editor.isEditable || !user.currentPage,
          onCompleted() {
            // user.setLoaded(true);
          },
        },
      );

      if (props.editor.isEditable) {
        return (
          <div data-widget-type="content-view">
            <div>Содержимое страницы</div>
            <div>
              <Editor
                height={200}
                width={800}
                defaultLanguage="html"
                defaultValue={props.block.props.html}
                onChange={(value) => {
                  props.editor.updateBlock(props.block, {
                    type: 'content-view',
                    props: { html: value },
                  });
                }}
              />
            </div>
          </div>
        );
      }
      if (!siteItem || loading) {
        return <Box style={{ height: 800 }} />;
        // return <Skeleton variant="rectangular" style={{ height: 800 }} />;
      }
      let showPreview = !user.user?.id && !props.editor.isEditable
      && !loaded && siteItem?.getSiteItem?.preview;
      showPreview = false;

      return (
        <div>
          <style>
            {`.page a{
            text-decoration: underline;
          }`}
          </style>
          <Head>
            <title>{siteItem?.getSiteItem?.title || ''}</title>
          </Head>
          {showPreview && (<div
            dangerouslySetInnerHTML={{
              __html: siteItem?.getSiteItem?.preview || '',
            }}
          />)}
          <div
            id="mmcms-page-content"
            style={{
              display: showPreview ? 'none' : 'block',
            }}
          >
            <ParsePage
              html={props.block.props.html}
              args={{
                content: <BlockView
                  blockContent={siteItem?.getSiteItem?.blockContent}
                />,
              }}
            />
          </div>
        </div>
      );
    },
  },
);

export const insertBlockEditorContentView = (editor: BlockNoteEditor) => (
  {
    title: 'Содержимое страницы',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'content-view' as any,
        props: {
          html: '{content}',
        } as any,
      });
    },
    aliases: [
      'content-view',
    ],
    group: 'Базовые блоки',
    icon: <Article />,
  }
);
