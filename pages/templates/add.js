import { createRoot } from 'react-dom/client';
import React, {
  StrictMode,
  useState,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
} from 'react';
import parse, { Element, Text } from 'html-react-parser';

const ThemeContext = createContext('replace');

const html = `
  <div class="App" style="font-family: sans-serif; text-align: center;">
    <h1>html-react-parser</h1>
    <p>Edit <code>src/index.jsx</code></p>
    <p>
      <a
        href="https://github.com/remarkablemark/html-react-parser"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    </p>
    <p class="remove">{text}</p>
  </div>
`;

function DynamicParse(props) {
  function Replace() {
    return <div>{props.replace}</div>;
  }

  try {
    const result = useMemo(() => {
      const options = {
        // replace(domNode) {
        //   if (
        //     domNode instanceof Text &&
        //     domNode.data.includes('{text}')
        //   ) {
        //     return <Replace />
        //     return <>{domNode.data.replace('{text}', getReplace())}</>;
        //   }
        // },
        transform(reactNode, domNode, index) {
          console.log('transform');
          console.log(domNode);
          console.log(reactNode);
          console.log(domNode?.attribs);
          console.log(domNode.constructor.name);
          if (domNode.constructor.name === 'Text' && domNode?.data?.includes('{text}')) {
            function Text2() {
              const cont = useContext(ThemeContext);
              console.log(cont);
              return <>{domNode.data.replace('{text}', cont)}</>;
            }
            console.log('generate');
            return <Text2 />;
          } if (
            domNode.constructor.name === 'Element'
            && !domNode.name.match(/^[a-z]+$/)
          ) {
            return null;
          }
          if (domNode?.attribs?.onclick) {
            const Tag = domNode.name;
            return (
              <Tag
                onClick={() => eval(domNode.attribs.onclick)}
                {...domNode.attribs}
              >
                {reactNode.props.children}
              </Tag>
            );
          }
          return <>{reactNode}</>;
        },
      };
      return parse(props.html, options);
    }, [props.html]);

    return (
      <ThemeContext.Provider value={props.replace}>
        {result}
      </ThemeContext.Provider>
    );
  } catch (e) {
    console.error(e);
    return '';
  }
}

function AddTemplate() {
  const [html, setHtml] = useState('<b>{text}</b>');
  const [replace, setReplace] = useState('replace');

  function Replace() {
    return <div>{getReplace()}</div>;
  }

  return (
    <div>
      <div>
        <textarea
          value={replace}
          onChange={(e) => {
            setReplace(e.target.value);
          }}
        />
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} />
      </div>
      <div>
        {/* {result} */}
        <DynamicParse html={html} replace={replace} />
      </div>
    </div>
  );
}

export default AddTemplate;
