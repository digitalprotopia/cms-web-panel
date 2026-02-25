import React, { createContext } from 'react';

export const PageContext = createContext<{
  data: Record<string, any>;
  setData:(key: string, value: any) => void;
  clearData: () => void;
  title: string;
  setTitle: (title: string) => void;
}>({
      data: {},
      setData: () => { },
      clearData: () => { },
      title: '',
      setTitle: () => { },
    });

export function PageProvider(props: { children: React.JSX.Element }) {
  const [data, setData] = React.useState<Record<string, any>>({});
  const [title, setTitle] = React.useState<string>('');
  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <PageContext.Provider value={{
      data,
      setData: (key, value) => {
        setData({ ...data, [key]: value });
      },
      clearData: () => {
        setData({});
      },
      title,
      setTitle: (t) => setTitle(t),
    }}
    >
      {props.children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  return React.useContext(PageContext);
}
