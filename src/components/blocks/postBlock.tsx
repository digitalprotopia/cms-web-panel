// eslint-disable-next-line import/no-cycle
import BlockEditor from '@/components/BlockEditor';
import { gql, useQuery } from '@apollo/client';
import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { TextInput } from '@mantine/core';
import { Article } from '@mui/icons-material';
import { useRouter } from 'next/router';
import React from 'react';

const GET_POST = gql`
  query GetPostBySlug($slug: String!) {
    getPostBySlug(slug: $slug) {
      id
      title
      content
      blockContent
    }
  }
`;

export const BlockEditorPostBlock = createReactBlockSpec(
  {
    type: 'post',
    propSchema: {
      cssClass: {
        type: 'string',
        default: '',
      },
    },
    content: 'none',
    isSelectable: false,
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();

      const slugs = router.query.slug || [];
      const slug = slugs[slugs.length - 1];

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data, loading, error } = useQuery(
        GET_POST,
        {
          variables: { slug },
          skip: !slug || props.editor.isEditable,
        },
      );

      let content: React.JSX.Element | null = null;

      if (props.editor.isEditable) {
        content = (
          <div>
            Пост по адресу
          </div>
        );
      } else if (!slug || (!loading && (error || !data?.getPostBySlug))) {
        content = (
          <div>
            Пост не найден
          </div>
        );
      } else if (loading) {
        content = null;
      } else if (data?.getPostBySlug) {
        content = (
          <div>
            <h2>{data.getPostBySlug.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: data.getPostBySlug.content }} />
            { /* eslint-disable-next-line @typescript-eslint/no-use-before-define */ }
            <BlockEditor
              initialData={data.getPostBySlug.blockContent}
              onChange={() => {}}
              isEditable={false}
            />
          </div>
        );
      }

      return (
        <div className="flex gap-2" data-widget-type="post">
          {
            props.editor.isEditable && (
              <div>
                <div>
                  <TextInput
                    size="small"
                    label="CSS класс"
                    value={props.block.props.cssClass}
                    onChange={(e) => {
                      props.editor.updateBlock(
                        props.block,
                        { props: {
                          ...props.block.props,
                          cssClass: e.target.value,
                        } },
                      );
                    }}
                  />
                </div>
              </div>
            )
          }
          <div className={props.block.props.cssClass}>
            {content}
          </div>
        </div>
      );
    },
  },
);

export const insertBlockEditorPostBlock = (editor: BlockNoteEditor) => (
  {
    title: 'Пост по адресу страницы',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'post' as any,
        props: {
        } as any,
      });
    },
    aliases: [
      'post',
    ],
    group: 'Базовые блоки',
    icon: <Article />,
  }
);
