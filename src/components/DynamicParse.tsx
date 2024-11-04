import React, {
  useMemo,
  createContext,
  useContext,
} from 'react';
import parse, { Element, Text, HTMLReactParserOptions } from 'html-react-parser';
import Script from 'next/script';

const ReplaceContext = createContext({});

function DynamicParse(props: {
  html: string;
  replace: Record<string, string>;
}) {
  console.log(props.replace);
  try {
    const result = useMemo(() => {
      const options: HTMLReactParserOptions = {
        transform(reactNode, domNode, index): React.ReactNode | null {
          if (domNode.type === 'text') {
            function Replace() {
              const replace = useContext(ReplaceContext);
              let result = domNode.data;
              console.log(replace);
              Object.keys(replace).forEach((key) => {
                result = result.replaceAll(`{${key}}`, replace[key]);
              });
              return result;
            }
            console.log('generate');
            return <Replace key={index} />;
          }
          if (
            domNode.type === 'tag'
            && !domNode.name.match(/^[a-z]+$/)
          ) {
            return null;
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
        {result}
      </ReplaceContext.Provider>
    );
  } catch (e) {
    console.error(e);
    return '';
  }
}

export default DynamicParse;
