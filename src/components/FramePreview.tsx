import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import UserContext from '@/components/UserContext';
import { ISiteItem, SiteItemType } from '@/components/entities/ISiteItem';
import { ITemplate } from '@/components/entities/ITemplate';
import Head from 'next/head';
import BlockEditor from '@/components/BlockEditor';
import { CircularProgress } from '@mui/material';
import Frame from 'react-frame-component';
import { createPortal } from 'react-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const renderTemplate = (
  template: ITemplate,
  templates: ITemplate[],
  templatesHistory: string[] = [],
): string => {
  if (templatesHistory.includes(template.id)) {
    return '';
  }
  templatesHistory.push(template.id);

  return template.html.replace(/\{include:([a-zA-Z0-9_]+)\}/g, (match) => {
    const name = match.replace(/\{include:([a-zA-Z0-9_]+)\}/, '$1');
    const nextTemplate = templates.find((t) => t.name === name);
    if (nextTemplate) {
      return renderTemplate(nextTemplate, templates, templatesHistory);
    }
    return '';
  });
};

function FramePreview1(props: {
  children: React.JSX.Element
}) {
  const user = useContext(UserContext);
  const pages = user.pages || [];

  const [frameRef, setFrameRef] = useState<HTMLIFrameElement | null>(null);

  const { site } = user;

  if (!site) return <span>Loading...</span>;

  const template = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'layout');
  let html = template ? renderTemplate(template, site?.templateGroup?.templates) : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  html = html.replace('{content}', `  <div className="page">
    <div>
      {content}
    </div>
  </div>`);

  const args = {
    menu: user.pages?.map((item) => {
      let { url } = item;
      let currentItem: (ISiteItem | null) = item;
      while (currentItem?.parentId) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        currentItem = pages.find((p) => p.id === currentItem!.parentId) || null;
        url = `${currentItem?.url}/${url}`;
      }
      return (
        <Link key={url} href={url}>
          <span className="mx-3">{item.title}</span>
        </Link>
      );
    }) || [],
    title: '',
    content: props.children,
  };

  console.log(frameRef);

  const cache = createCache({
    key: 'css',
    container: frameRef?.contentWindow?.document?.head,
    prepend: true,
  });

  return (
    <CacheProvider value={cache}>
      <Frame style={{ width: '100%', height: 400 }} ref={setFrameRef}>
        <style>
          {`.page a{
          text-decoration: underline;
        }`}
        </style>
        <ParsePage html={html} args={args} />
      </Frame>
    </CacheProvider>
  );
}

function FramePreview(props: {
  children: React.JSX.Element
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [div, setDiv] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const check = setInterval(() => {
      if (!frameRef.current) {
        return;
      }
      const frame = frameRef.current.contentWindow;
      if (!frame) {
        return;
      }
      const contentDiv = frame!.document.getElementById('page-content');
      if (contentDiv) {
        console.log(contentDiv);
        setDiv(contentDiv);
        clearInterval(check);
      }
    }, 2000);
    return () => clearInterval(check);
  }, []);

  const cache = createCache({
    key: 'css',
    container: frameRef.current?.contentWindow?.document?.head,
    prepend: true,
  });

  return (
    <>
      {div ? null : <CircularProgress />}
      <CacheProvider value={cache}>
        <iframe
          ref={frameRef}
          title="preview"
          style={{ width: '100%', height: div ? 400 : 0 }}
          src="/nopage"
        />
        {div && createPortal(props.children, div)}
      </CacheProvider>
    </>
  );
}

export default FramePreview;
