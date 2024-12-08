import {
  TextField,
  Typography,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { parseReact } from '@/components/DynamicParse';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const GET_SITEITEM_BY_URL = gql`
  query GetSiteItemByUrl($url: String!) {
    getSiteItemByUrl(url: $url) {
      url
      title
      html
      id
    }
    getAllSites {
      templateGroup {
        templates {
          name
          html
        }
      }
    }
    getAllSiteItems {
      title
      url
    }
  }
`;

function DynamicReact() {
  const [data, setData] = useState('{ a: 1, b: 2 }');
  const [code, setCode] = useState(`
    function Component(props) {
      return <b>{props.b * 100}{JSON.stringify(props)}</b>;
    }
  `);
  let dataObject: any;
  try {
    dataObject = JSON.parse(data);
  } catch {
    dataObject = {};
  }
  return (
    <div>
      <TextField
        multiline
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <TextField
        multiline
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <ErrorBoundary
        fallback="error"
        // fallbackRender={() => 'error'}
        resetKeys={[code, dataObject]}
        onError={(err) => {console.log(err)}}
      >
        {parseReact(code, dataObject)}
      </ErrorBoundary>
    </div>
  );
}

function DynamicPage() {
  const slug = useRouter().query.slug as string[];

  const { data: siteItem, loading: siteItemLoading, error } = useQuery(
    GET_SITEITEM_BY_URL,
    {
      variables: { url: slug?.[0] || '' },
    },
  );

  if (siteItemLoading) return <span>Loading...</span>;

  const site = siteItem?.getAllSites?.[0];
  const template = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'layout');
  let html = template ? template.html : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  if (error || !siteItem?.getSiteItemByUrl) {
    return (
      <div className="page">
        404
      </div>
    );
  }

  html = html.replace('{content}', `  <div className="page">
    <div>
      {title}
      ${siteItem?.getSiteItemByUrl?.html || ''}
    </div>
  </div>`);

  const args = {
    menu: siteItem?.getAllSiteItems.map((item: any) => (
      <Link key={item.url} href={item.url}>
        <span className="mx-3">{item.title}</span>
      </Link>
    )),
    title:
  <Typography variant="h4">
    {siteItem.getSiteItemByUrl.title}
  </Typography>,
  };

  return (
    <>
      <style>
        {`.page a{
          text-decoration: underline;
        }`}
      </style>
      <DynamicReact />
      <ParsePage html={html} args={args} />
    </>
  );
}

export default DynamicPage;
