import BlockEditor from '@/components/BlockEditor';

function TemplateBlocks(props: {
  blockContent: any;
  onChange: (value: any) => void;
}) {
  return (<BlockEditor
    initialData={props.blockContent}
    onChange={props.onChange}
    type="template"
  />);
}

export default TemplateBlocks;
