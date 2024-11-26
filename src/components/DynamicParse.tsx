import React, {
  useMemo,
  createContext,
  useContext,
} from 'react';
import parse, {
  Text, HTMLReactParserOptions, domToReact,
  attributesToProps,
  DOMNode,
} from 'html-react-parser';
import Script from 'next/script';
import reactStringReplace from 'react-string-replace';
import { ErrorBoundary } from 'react-error-boundary';

const ReplaceContext = createContext<Record<string, string | React.JSX.Element>>({});

function DynamicParse(props: {
  html: string;
  replace: Record<string, string | React.JSX.Element>;
}) {
  try {
    const result = useMemo(() => {
      const options: HTMLReactParserOptions = {
        transform(reactNode, domNode, index) {
          if (domNode.type === 'text') {
            function Replace() {
              const replace = useContext(ReplaceContext);
              let _result: React.ReactNode[] | string = (domNode as Text).data;
              Object.keys(replace).forEach((key) => {
                _result = reactStringReplace(_result, `{${key}}`, () => replace[key]);
              });
              return _result;
            }
            return <Replace key={index} />;
          }
          if (
            domNode.type === 'tag'
            && !domNode.name.match(/^[a-z]+$/)
          ) {
            return null;
          }
          if (domNode.type === 'tag' && domNode.attribs && Object.keys(domNode.attribs).length) {
            const Tag = domNode.name;
            Object.keys(domNode.attribs).forEach((attr) => {
              Object.keys(props.replace).forEach((key) => {
                domNode.attribs[attr] = domNode.attribs[attr].replaceAll(`{${key}}`, props.replace[key] as string);
              });
            });
            const _props = attributesToProps(domNode.attribs);
            console.log(Tag);
            return (
              <Tag {..._props}>
                {Tag === 'img' ? null : domToReact(domNode.children as DOMNode[], options)}
              </Tag>
            );
          }
          if (domNode.type === 'tag' && domNode.attribs?.onclick) {
            const Tag:React.ElementType = domNode.name as any;
            return (
              <Tag
                // eslint-disable-next-line no-eval
                onClick={() => eval(domNode.attribs.onclick)}
                {...domNode.attribs}
              >
                {(reactNode as React.JSX.Element).props.children}
              </Tag>
            );
          }
          if (domNode.type === 'tag' && domNode?.name === 'script') {
            return (
              <Script id="">
                {(domNode.children[0] as any).data}
              </Script>
            );
          }
          return reactNode as React.JSX.Element;
        },
      };
      return parse(props.html, options);
    }, [props.html]);

    return (
      <ReplaceContext.Provider value={props.replace}>
        <ErrorBoundary fallback="Ошибка разбора" resetKeys={[props.html]}>
          {result}
        </ErrorBoundary>
      </ReplaceContext.Provider>
    );
  } catch (e) {
    console.error(e);
    return '';
  }
}

export default DynamicParse;
