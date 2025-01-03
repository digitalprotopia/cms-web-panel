import { gql, useQuery } from '@apollo/client';
import {
  BlockNoteEditor, defaultProps, insertOrUpdateBlock, BlockNoteSchema,
  defaultBlockSpecs, filterSuggestionItems,
  locales,
  combineByGroup,
} from '@blocknote/core';
import {
  createReactBlockSpec, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote,
} from '@blocknote/react';
import { Menu } from '@mantine/core';
import { RiAlertFill } from 'react-icons/ri';
import {
  multiColumnDropCursor, withMultiColumn,
  locales as multiColumnLocales, getMultiColumnSlashMenuItems,
} from '@blocknote/xl-multi-column';
import { useMemo } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { WidgetsOutlined } from '@mui/icons-material';
import { IWidget } from './entities/IWidget';
import { PageWidget } from './ParsePage';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

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
      // eslint-disable-next-line react-hooks/rules-of-hooks
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
        <div className={props.editor.isEditable ? 'widget' : ''} data-widget-type={props.block.props.type}>
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
          <div>
            {props.block.props.type ? <PageWidget widgetName={props.block.props.type} /> : null}
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

interface BlockEditorProps {
  initialData: any;
  onChange: (data: any) => void;
  isEditable?: boolean;
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
  const getSlashMenuItems = useMemo(() => async (query: string) => filterSuggestionItems(
    combineByGroup(
      getDefaultReactSlashMenuItems(editor),
      getMultiColumnSlashMenuItems(editor),
    ),
    query,
  ), [editor]);

  return (
    <>
      <style>
        {`
        .bn-editor {
          ${isEditable ? null : 'padding-inline: 0px;'}
        }
      `}
      </style>
      <BlockNoteView
        slashMenu={false}
        editor={editor}
        editable={isEditable}
        onChange={() => {
          onChange(editor.document);
          console.log(editor.document);
        // editor.blocksToFullHTML(editor.document).then((html) => {
        //   setFormData({ ...formData, html });
        // });
        }}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => (
          // Gets all default slash menu items and `insertAlert` item.
            filterSuggestionItems(
              [...combineByGroup(
                getDefaultReactSlashMenuItems(editor),
                getMultiColumnSlashMenuItems(editor),
              ),
              ...insertBlockEditorWidgets(editor as any, snippets.data?.getAllWidgets || [])],
              query,
            ))}
        />
      </BlockNoteView>
    </>
  );
}

export default BlockEditor;
