import React, {
  useMemo,
  createContext,
  useContext,
} from 'react';
import parse, {
  Element, Text, HTMLReactParserOptions, domToReact,
  attributesToProps,
} from 'html-react-parser';
import Script from 'next/script';
import reactStringReplace from 'react-string-replace';
import { ErrorBoundary } from 'react-error-boundary';

const ReplaceContext = createContext({});

function DynamicParse(props: {
  html: string;
  replace: Record<string, string | React.JSX.Element>;
}) {
  try {
    const result = useMemo(() => {
      const options: HTMLReactParserOptions = {
        transform(reactNode, domNode, index): React.ReactNode | null {
          if (domNode.type === 'text') {
            function Replace() {
              const replace = useContext(ReplaceContext);
              let result = domNode.data;
              Object.keys(replace).forEach((key) => {
                result = reactStringReplace(result, `{${key}}`, (match, i) => replace[key]);
              });
              return result;
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
                domNode.attribs[attr] = domNode.attribs[attr].replaceAll(`{${key}}`, props.replace[key]);
              });
            });
            const _props = attributesToProps(domNode.attribs);
            console.log(Tag);
            return (
              <Tag {..._props}>
                {Tag === 'img' ? null : domToReact(domNode.children, options)}
              </Tag>
            );
          }
          if (domNode.type === 'tag' && domNode.attribs?.onclick) {
            const Tag:React.ElementType = domNode.name as any;
            return (
              <Tag
                onClick={() => eval(domNode.attribs.onclick)}
                {...domNode.attribs}
              >
                {(reactNode as React.JSX.Element).props.children}
              </Tag>
            );
          }
          if (domNode.type === 'tag' && domNode?.name === 'script') {
            return (
              <Script>
                {domNode.children[0].data}
              </Script>
            );
          }
          return reactNode;
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
