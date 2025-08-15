import { gql, useQuery } from '@apollo/client';
import { BlockNoteSchema,
  defaultBlockSpecs, filterSuggestionItems,
  locales,
  combineByGroup,
  Block,
  BlockNoteEditor,
  defaultStyleSpecs,
  CustomBlockConfig,
  InlineContentSchema,
  StyleSchema } from '@blocknote/core';

import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote,

  useBlockNoteEditor,
  useComponentsContext,
  SideMenuController,
  SideMenu,
  DragHandleMenu,
  RemoveBlockItem,
  BlockColorsItem,
  DragHandleMenuProps,
  FormattingToolbarController,
  FormattingToolbar,
  BlockTypeSelect,
  FileCaptionButton,
  BasicTextStyleButton,
  FileReplaceButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  ReactCustomBlockRenderProps } from '@blocknote/react';
import {
  multiColumnDropCursor, withMultiColumn,
  locales as multiColumnLocales, getMultiColumnSlashMenuItems,
} from '@blocknote/xl-multi-column';
// import { useMemo } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { MoreVert } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import { BlockEditorCssView, insertBlockEditorCssView } from './blockEditor/blocks/templates/css';
import { BlockEditorHeadView, insertBlockEditorHeadView } from './blockEditor/blocks/templates/head';
// eslint-disable-next-line import/no-cycle
import { BlockEditorContentView, insertBlockEditorContentView } from './blockEditor/blocks/templates/content';
// eslint-disable-next-line import/no-cycle
import { BlockEditorPostBlock, insertBlockEditorPostBlock } from './blockEditor/blocks/postBlock';
// eslint-disable-next-line import/no-cycle
import { BlockEditorImageBlock, insertBlockEditorImageBlock } from './blockEditor/blocks/imageBlock';
// eslint-disable-next-line import/no-cycle
import { BlockEditorWidget, insertBlockEditorWidgets } from './blockEditor/blocks/blockEditorWidget';
import BlockEditorHtmlView, { insertBlockEditorHtmlView } from './blockEditor/blocks/blockEditorHtmlView';
// eslint-disable-next-line import/no-cycle
import { BlockEditorForm, insertBlockEditorForms } from './blockEditor/blocks/blockEditorForm';
// eslint-disable-next-line import/no-cycle
import { BlockEditorPosts, insertBlockEditorPosts } from './blockEditor/blocks/blockEditorPosts';
// eslint-disable-next-line import/no-cycle
import { ClassStyle, SetClassButton } from './blockEditor/blocks/classButton';

export function BlockSettings(
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

export function Posts(props: {
  urlPrefix?: string;
}) {
  const posts = useQuery(gql`
    query {
      getPosts {
        id
        title
        slug
        createdAt
        content
        blockContent
      }
    }
  `);

  if (!posts.data) {
    return null;
  }

  return (
    <div>
      {posts.data.getPosts.map((post: any) => (
        <div key={post.id}>
          <h2>
            {
            props.urlPrefix
              ? <Link href={`${props.urlPrefix}${post.slug}`}>{post.title}</Link>
              : post.title
          }
          </h2>
          <div>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</div>
          {/* <div dangerouslySetInnerHTML={{ __html: post.content }} /> */}
          { /* eslint-disable-next-line @typescript-eslint/no-use-before-define */ }
          {/* <BlockEditor
            initialData={post.blockContent}
            onChange={() => {}}
            isEditable={false}
          /> */}
        </div>
      ))}
    </div>
  );
}

interface BlockEditorProps {
  initialData: any;
  onChange: (data: any) => void;
  isEditable?: boolean;
  type?: 'page' | 'template';
  setEditor?: (editor: BlockNoteEditor<any>) => void;
}

export function AddBlocksItem(props: DragHandleMenuProps) {
  const editor = useBlockNoteEditor();

  const Components = useComponentsContext()!;

  return (
    <>
      <Components.Generic.Menu.Item
        onClick={() => {
          let { block } = props;
          while (editor.getParentBlock(block)) {
            block = editor.getParentBlock(block) as Block;
            console.log(block);
          }

          if (editor.getPrevBlock(block)) {
            editor.insertBlocks([{
              ...props.block,
              id: undefined,
            }], editor.getPrevBlock(block)!, 'before');
            editor.removeBlocks([props.block]);
          }
        }}
      >
        Перенести выше
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        onClick={() => {
          let { block } = props;
          while (editor.getParentBlock(block)) {
            block = editor.getParentBlock(block) as Block;
            console.log(block);
          }

          if (editor.getNextBlock(block)) {
            editor.insertBlocks([{
              ...props.block,
              id: undefined,
            }], editor.getNextBlock(block)!, 'after');
            editor.removeBlocks([props.block]);
          }
        }}
      >
        Перенести ниже
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        onClick={() => {
          let { block } = props;
          while (editor.getParentBlock(block)) {
            block = editor.getParentBlock(block) as Block;
            console.log(block);
          }

          editor.insertBlocks([{
            type: 'paragraph',
            props: {},
          }], block, 'before');
        }}
      >
        Добавить сверху
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        onClick={() => {
          let { block } = props;
          while (editor.getParentBlock(block)) {
            block = editor.getParentBlock(block) as Block;
            console.log(block);
          }

          editor.insertBlocks([{
            type: 'paragraph',
            props: {},
          }], block, 'after');
        }}
      >
        Добавить снизу
      </Components.Generic.Menu.Item>
    </>
  );
}

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Adds all default blocks.
    ...defaultBlockSpecs,
    // Adds the Alert block.
    widget: BlockEditorWidget,
    form: BlockEditorForm,
    posts: BlockEditorPosts,
    'html-view': BlockEditorHtmlView,
    'css-view': BlockEditorCssView,
    'head-view': BlockEditorHeadView,
    'content-view': BlockEditorContentView,
    post: BlockEditorPostBlock,
    'cms-image': BlockEditorImageBlock,
  },
  styleSpecs: {
    ...defaultStyleSpecs,
    class: ClassStyle,
  },
});

function BlockEditor({
  initialData,
  onChange,
  isEditable = true,
  type = 'page',
  setEditor = () => {},
}: BlockEditorProps) {
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
    }`, {
    skip: !isEditable,
  });

  const editor = useCreateBlockNote({
    initialContent: initialData && initialData.length ? initialData : null,
    schema: withMultiColumn(schema),
    // The default drop cursor only shows up above and below blocks - we replace
    // it with the multi-column one that also shows up on the sides of blocks.
    dropCursor: multiColumnDropCursor,
    // Merges the default dictionary with the multi-column dictionary.
    dictionary: {
      ...locales.ru,
      multi_column: multiColumnLocales.ru,
    },
    domAttributes: {
      editor: {
        'data-editable': isEditable ? '1' : '0',
      },
    },
  });

  useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

  const ref = useRef<HTMLDivElement>();

  // Gets the default slash menu items merged with the multi-column ones.
  // const getSlashMenuItems = useMemo(() => async (query: string) => filterSuggestionItems(
  //   combineByGroup(
  //     getDefaultReactSlashMenuItems(editor),
  //     getMultiColumnSlashMenuItems(editor),
  //   ),
  //   query,
  // ), [editor]);

  useEffect(() => {
    if (!isEditable && ref.current) {
      [...(ref.current?.getElementsByClassName('bn-editor') || [])].forEach((el) => {
        if (el.getAttribute('data-editable') === '0') {
          el.removeAttribute('class');
        }
      });
      [...(ref.current?.getElementsByClassName('bn-container') || [])].forEach((el) => {
        el.removeAttribute('class');
      });

      setTimeout(() => {
        [...(ref.current?.getElementsByClassName('bn-editor') || [])].forEach((el) => {
          if (el.getAttribute('data-editable') === '0') {
            el.removeAttribute('class');
          }
        });
        [...(ref.current?.getElementsByClassName('bn-container') || [])].forEach((el) => {
          el.removeAttribute('class');
        });
      }, 200);
    }
  }, [ref.current, initialData, isEditable]);

  const templateInserts = [
    insertBlockEditorCssView(editor as any),
    insertBlockEditorHeadView(editor as any),
    insertBlockEditorContentView(editor as any),
  ];

  return (
    <>
      <style>
        {`
        .bn-container[data-theming-css-view] .bn-editor {
          padding-inline: 0px;
        }

        .mmcms-blocks-template .bn-block-content {
            display: block;
            padding: 0px;
        }

        .mmcms-blocks-template .bn-file-block-content-wrapper {
            max-width: 100%;
        }

        .mmcms-blocks-template .bn-block-group {
          margin: 0px;
        }

        .mmcms-blocks-template .bn-block-outer:before,
        .mmcms-blocks-template .bn-block-group .bn-block-group>.bn-block-outer:not([data-prev-depth-changed]):before
         {
          border: 0px;
        }
        
      `}
      </style>
      <div
        style={isEditable ? {
          borderColor: 'lightgray',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 4,
        } : undefined}
        // @ts-expect-error error
        ref={ref}
      >
        <BlockNoteView
          slashMenu={false}
          sideMenu={false}
          formattingToolbar={false}
          editor={editor}
          editable={isEditable}
          contentEditable={isEditable === false ? false : undefined}
          theme="light"
          onChange={() => {
            onChange(editor.document);
            // editor.blocksToFullHTML(editor.document).then((html) => {
            //   setFormData({ ...formData, html });
            // });
          }}
          {...(isEditable ? {} : {
            'data-theming-css-view': true,
          })}
        >
          <SideMenuController
            sideMenu={(props) => (
              <SideMenu
                {...props}
                dragHandleMenu={(_props) => (
                  <DragHandleMenu {..._props}>
                    <RemoveBlockItem {..._props}>Удалить</RemoveBlockItem>
                    <BlockColorsItem {..._props}>Цвета</BlockColorsItem>
                    <AddBlocksItem {..._props}>Добавить строки</AddBlocksItem>
                  </DragHandleMenu>
                )}
              />
            )}
          />
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => (
              // Gets all default slash menu items and `insertAlert` item.
              filterSuggestionItems(
                [
                  insertBlockEditorHtmlView(editor as any),
                  insertBlockEditorPostBlock(editor as any),
                  insertBlockEditorImageBlock(editor as any),
                  ...(type === 'template' ? templateInserts : []),
                  ...combineByGroup(
                    getDefaultReactSlashMenuItems(editor),
                    getMultiColumnSlashMenuItems(editor),
                  ),
                  ...insertBlockEditorWidgets(editor as any, snippets.data?.getAllWidgets || []),
                  ...insertBlockEditorForms(editor as any, snippets.data?.getAllForms || []),
                  insertBlockEditorPosts(editor as any),
                ],
                query,
              ))}
          />
          <FormattingToolbarController
            formattingToolbar={() => (
              <FormattingToolbar>
                <BlockTypeSelect key="blockTypeSelect" />

                <FileCaptionButton key="fileCaptionButton" />
                <FileReplaceButton key="replaceFileButton" />

                <BasicTextStyleButton
                  basicTextStyle="bold"
                  key="boldStyleButton"
                />
                <BasicTextStyleButton
                  basicTextStyle="italic"
                  key="italicStyleButton"
                />
                <BasicTextStyleButton
                  basicTextStyle="underline"
                  key="underlineStyleButton"
                />
                <BasicTextStyleButton
                  basicTextStyle="strike"
                  key="strikeStyleButton"
                />
                {/* Adds SetFontStyleButton */}
                <SetClassButton />

                <TextAlignButton
                  textAlignment="left"
                  key="textAlignLeftButton"
                />
                <TextAlignButton
                  textAlignment="center"
                  key="textAlignCenterButton"
                />
                <TextAlignButton
                  textAlignment="right"
                  key="textAlignRightButton"
                />

                <ColorStyleButton key="colorStyleButton" />

                <NestBlockButton key="nestBlockButton" />
                <UnnestBlockButton key="unnestBlockButton" />

                <CreateLinkButton key="createLinkButton" />
              </FormattingToolbar>
            )}
          />
        </BlockNoteView>
      </div>
    </>
  );
}

export function BlockView(props: { blockContent: any }) {
  return (
    <BlockEditor
      initialData={props.blockContent}
      onChange={() => {}}
      isEditable={false}
    />
  );
}

export default BlockEditor;
