import { gql, useQuery } from '@apollo/client';
import {
  BlockNoteEditor, defaultProps, insertOrUpdateBlock, BlockNoteSchema,
  defaultBlockSpecs, filterSuggestionItems,
  locales,
  combineByGroup,
  Block,
  CustomBlockConfig,
  InlineContentSchema,
  StyleSchema,
  defaultStyleSpecs,
} from '@blocknote/core';
import {
  createReactBlockSpec, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote,

  useBlockNoteEditor,
  useComponentsContext,
  SideMenuController,
  SideMenu,
  DragHandleMenu,
  RemoveBlockItem,
  BlockColorsItem,
  DragHandleMenuProps,
  ReactCustomBlockRenderProps,
  createReactStyleSpec,
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
} from '@blocknote/react';
import { Menu } from '@mantine/core';
import {
  multiColumnDropCursor, withMultiColumn,
  locales as multiColumnLocales, getMultiColumnSlashMenuItems,
} from '@blocknote/xl-multi-column';
// import { useMemo } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  DashboardOutlined, MoreVert, WidgetsOutlined, Html,
  Visibility,
} from '@mui/icons-material';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField,
  Tooltip,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { IWidget } from './entities/IWidget';
// eslint-disable-next-line import/no-cycle
import { FormWidget, PageWidget } from './ParseWidgets';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { IForm } from './entities/IForm';
import { BlockEditorCssView, insertBlockEditorCssView } from './blocks/templates/css';
import { BlockEditorHeadView, insertBlockEditorHeadView } from './blocks/templates/head';
// eslint-disable-next-line import/no-cycle
import { BlockEditorContentView, insertBlockEditorContentView } from './blocks/templates/content';
// eslint-disable-next-line import/no-cycle
import { BlockEditorPostBlock, insertBlockEditorPostBlock } from './blocks/postBlock';
import { BlockEditorImageBlock, insertBlockEditorImageBlock } from './blocks/imageBlock';

export const ClassStyle = createReactStyleSpec(
  {
    type: 'class',
    propSchema: 'string',
  },
  {
    render: (props) => (
      <span className={props.value} ref={props.contentRef} />
    ),
  },
);

function SetClassButton() {
  const editor = useBlockNoteEditor<
    typeof schema.blockSchema,
    typeof schema.inlineContentSchema,
    typeof schema.styleSchema
  >();

  if (!editor.isEditable) {
    return null;
  }

  return (
    <Button
      onClick={(values) => {
        console.log(values);
        const fontName = prompt('Укажите класс', editor.getActiveStyles().class);
        if (fontName !== null) {
          editor.addStyles({
            class: fontName,
          });
        }
      }}
    >
      <Tooltip title={editor.getActiveStyles().class}>
        <span>CSS Class</span>
      </Tooltip>
    </Button>
  );
}

function BlockSettings(
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
                        {snippets.data?.getAllWidgets?.find((w: IWidget) => w.name === props.block.props.type)?.title || 'Выберете виджет'}
                      </Menu.Item>
                    </div>
                  </Menu.Target>
                  {/* Dropdown to change the Widget type */}
                  <Menu.Dropdown>
                    <Menu.Label>Виджет</Menu.Label>
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

export function Posts() {
  const posts = useQuery(gql`
    query {
      getPosts {
        id
        title
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
          <h2>{post.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
          { /* eslint-disable-next-line @typescript-eslint/no-use-before-define */ }
          <BlockEditor
            initialData={post.blockContent}
            onChange={() => {}}
            isEditable={false}
          />
        </div>
      ))}
    </div>
  );
}

export const BlockEditorPosts = createReactBlockSpec(
  {
    type: 'posts',
    propSchema: {

    },
    content: 'none',
    isSelectable: false,
  },
  {
    render: (props) => (
      <div data-widget-type="posts">
        {props.editor.isEditable
          ? (
            <div style={{ pointerEvents: 'none' }}>
              <Posts />
            </div>
          )
          : <Posts />}
      </div>
    ),
  },
);

export const BlockEditorHtmlView = createReactBlockSpec(
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

export const insertBlockEditorPosts = (editor: BlockNoteEditor) => (
  {
    title: 'Посты',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'posts' as any,
        props: {
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

interface BlockEditorProps {
  initialData: any;
  onChange: (data: any) => void;
  isEditable?: boolean;
  type?: 'page' | 'template';
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

const schema = BlockNoteSchema.create({
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
  initialData, onChange, isEditable = true,
  type = 'page',
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
    // eslint-disable-next-line no-nested-ternary
    initialContent: initialData ? (initialData.length ? initialData : null) : null,
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
  }, [ref.current, initialData]);

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
