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
import Link from 'next/link';

import * as Mui from '@mui/material';

import * as babel from '@babel/standalone';

export function parseReact(code: string):
{ Component: React.ComponentType<any>, filter?: (data: any[]) => any[] } {
  try {
    const babelCode = babel.transform(code, {
      presets: ['react', 'es2017'],
    }).code;

    const resultCode = babelCode!.replace('"use strict";', '').trim();
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function('React, Mui, Link', `
      let filter = null;
      
      ${resultCode}

      const result = { 
        Component
      };
      if (filter) {
        result.filter = filter;
      }
      return result;
    `);
    return func(React, Mui, Link);
  } catch {
    return { Component: () => <div>Ошибка разбора</div> };
  }
}

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
            let Tag: any = domNode.name;
            Object.keys(domNode.attribs).forEach((attr) => {
              Object.keys(props.replace).forEach((key) => {
                domNode.attribs[attr] = domNode.attribs[attr].replaceAll(`{${key}}`, props.replace[key] as string);
              });
            });
            const _props = attributesToProps(domNode.attribs);
            if (domNode.name === 'a' && domNode.attribs.href) {
              Tag = Link;
            }
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
