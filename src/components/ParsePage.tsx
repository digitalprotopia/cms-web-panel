/* eslint-disable react/no-danger */
import parse, { attributesToProps, DOMNode, domToReact } from 'html-react-parser';
import reactStringReplace from 'react-string-replace';
import Link from 'next/link';
import { useMemo } from 'react';
// eslint-disable-next-line import/no-cycle
import { Posts } from './BlockEditor';
import { FormWidget, PageWidget } from './ParseWidgets';

function ParsePage(props: {
  html: string;
  args?: Record<string, string | React.JSX.Element | React.JSX.Element[]>
}) {
  return useMemo(() => parse(
    props.html,
    {
      transform(reactNode, domNode) {
        if (domNode.type === 'tag' && domNode.name === 'a' && domNode.attribs.href) {
          const _props = attributesToProps(domNode.attribs);
          return (
            <Link {..._props as any}>
              {domToReact(domNode.children as DOMNode[])}
            </Link>
          );
        }
        if (domNode.type === 'text') {
          let result: string | React.ReactNode[] = domNode.data;
          if (props.args) {
            Object.keys(props.args).forEach((key) => {
              result = reactStringReplace(result, `{${key}}`, () => (props.args!)[key]);
            });
          }
          result = reactStringReplace(result, '[posts]', () => <Posts />);
          return reactStringReplace(result, /\[([a-zA-Z0-9]+:[a-zA-Z0-9]+)\]/g, (match, i) => {
            const parts = match.split(':');
            if (parts[0] === 'widget') {
              return (<PageWidget widgetName={parts[1]} key={i} />);
            }
            if (parts[0] === 'form') {
              return <FormWidget formName={parts[1]} key={i} />;
            }
            return match;
          }) as unknown as React.JSX.Element;
        }
        return reactNode as React.JSX.Element;
      },
    },
  ), [props.html, props.args]);
}

export default ParsePage;
