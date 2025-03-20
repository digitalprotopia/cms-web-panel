import { CircularProgress } from '@mui/material';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
          }}
          id="first-loader"
        >
          <CircularProgress size={80} />
        </div>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
