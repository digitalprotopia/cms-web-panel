import { gql, useQuery } from '@apollo/client';
import {
  BlockNoteEditor, defaultProps, insertOrUpdateBlock, BlockNoteSchema,
  defaultBlockSpecs, filterSuggestionItems,
  locales,
  combineByGroup,
  Block,
} from '@blocknote/core';
import {
  createReactBlockSpec, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote,

  SideMenuProps,
  useBlockNoteEditor,
  useComponentsContext,
  SideMenuController,
  SideMenu,
  DragHandleButton,
  AddBlockButton,
} from '@blocknote/react';
import { Menu } from '@mantine/core';
import {
  multiColumnDropCursor, withMultiColumn,
  locales as multiColumnLocales, getMultiColumnSlashMenuItems,
} from '@blocknote/xl-multi-column';
// import { useMemo } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  DashboardOutlined, North, South, WidgetsOutlined,
} from '@mui/icons-material';
import { IWidget } from './entities/IWidget';
import { FormWidget, PageWidget } from './ParseWidgets';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { IForm } from './entities/IForm';

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
            )
            : null}
          <div style={{ flex: 1 }}>
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
            )
            : null}
          <div style={{ flex: 1 }}>
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
        {props.editor.isEditable ? <Posts /> : <Posts />}
      </div>
    ),
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

interface BlockEditorProps {
  initialData: any;
  onChange: (data: any) => void;
  isEditable?: boolean;
}

export function AddBottomButton(props: SideMenuProps) {
  const editor = useBlockNoteEditor();

  const Components = useComponentsContext()!;

  return (
    <Components.SideMenu.Button
      label="Добавить снизу"
      icon={(
        <South
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
        />
      )}
    />
  );
}

export function AddUpButton(props: SideMenuProps) {
  const editor = useBlockNoteEditor();

  const Components = useComponentsContext()!;

  return (
    <Components.SideMenu.Button
      label="Добавить сверху"
      icon={(
        <North
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
        />
      )}
    />
  );
}

function BlockEditor({
  initialData, onChange, isEditable = true,
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

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // Adds all default blocks.
      ...defaultBlockSpecs,
      // Adds the Alert block.
      widget: BlockEditorWidget,
      form: BlockEditorForm,
      posts: BlockEditorPosts,
    },
  });

  const editor = useCreateBlockNote({
    initialContent: initialData,
    schema: withMultiColumn(schema),
    // The default drop cursor only shows up above and below blocks - we replace
    // it with the multi-column one that also shows up on the sides of blocks.
    dropCursor: multiColumnDropCursor,
    // Merges the default dictionary with the multi-column dictionary.
    dictionary: {
      ...locales.ru,
      multi_column: multiColumnLocales.ru,
    },
  });

  // Gets the default slash menu items merged with the multi-column ones.
  // const getSlashMenuItems = useMemo(() => async (query: string) => filterSuggestionItems(
  //   combineByGroup(
  //     getDefaultReactSlashMenuItems(editor),
  //     getMultiColumnSlashMenuItems(editor),
  //   ),
  //   query,
  // ), [editor]);

  return (
    <>
      <style>
        {`
        .bn-editor {
          ${isEditable ? null : 'padding-inline: 0px;'}
        }
      `}
      </style>
      <div style={isEditable ? {
        borderColor: 'lightgray',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 4,
      } : {
        pointerEvents: 'none',
      }}
      >
        <BlockNoteView
          slashMenu={false}
          sideMenu={false}
          editor={editor}
          editable={isEditable}
          onChange={() => {
            onChange(editor.document);
            // editor.blocksToFullHTML(editor.document).then((html) => {
            //   setFormData({ ...formData, html });
            // });
          }}
        >
          <SideMenuController
            sideMenu={(props) => (
              <SideMenu {...props}>
                {/* Button which removes the hovered block. */}
                <AddBlockButton {...props} />
                <AddUpButton {...props} />
                <AddBottomButton {...props} />
                <DragHandleButton {...props} />
              </SideMenu>
            )}
          />
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => (
              // Gets all default slash menu items and `insertAlert` item.
              filterSuggestionItems(
                [...combineByGroup(
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
