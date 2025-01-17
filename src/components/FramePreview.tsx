import React, {
  useEffect, useRef, useState,
} from 'react';
import { CircularProgress } from '@mui/material';
import { createPortal } from 'react-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

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
