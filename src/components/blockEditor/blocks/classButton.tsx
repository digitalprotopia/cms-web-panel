import {
  Button,
  Tooltip,
} from '@mui/material';

import { createReactStyleSpec, useBlockNoteEditor } from '@blocknote/react';
// eslint-disable-next-line import/no-cycle
import { schema } from '@/components/BlockEditor';

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

export function SetClassButton() {
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
