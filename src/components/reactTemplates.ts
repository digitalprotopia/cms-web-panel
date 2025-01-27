const reactTemplates: Record<string, { definition: string, type: string }> = {
  list: {
    definition: `
      let filter = null;
      const result = { 
      }
      const MMCMS = {
        setFilter: (f) => {
          filter = f;
        },
        setSearch: (search) => {
          result.search = search();
        },
        setComponent: (c) => {
          result.Component = c;
        },
        setListComponent: (c) => {
          result.ListComponent = c;
        },
        setStaticComponent: (c) => {
          result.ListComponent = c;
        },
        setGetColor: (c) => {
          result.getColor = c;
        },
        user: data.user,
        pages: data.pages,
        Link: data.Link,
        router: data.router,
        context: data.context,
        Head: data.Head,
      };
      
      {resultCode}

      if (typeof Component !== 'undefined') {
        result.Component = Component;
      }
      
      if (filter) {
        result.filter = filter;
      }
      return result;
        `,
    type: `
        delcare const user: {
        id: string;
        name: string;
      }
      declare let filter: (row: any) => boolean;
      declare const Link: (props: {href: string}) => React.ReactNode;
      declare const result = {
        Component?: (props: {row: any}) => React.ReactNode;
        filter?: (row: any) => boolean;
      };
      declare const MMCMS: {
        setFilter: (f: (row: any) => boolean) => void;
        setComponent: (c: (props: {row: any}) => React.ReactNode) => void;
        setListComponent: (c: (props: {
        data: any[], children: React.ReactNode, 
        Component: React.ComponentType<any>,
        WidgetMap: React.ComponentType<any>,
        MapComponent: React.ComponentType<any>,
        mapProps: any,
        }) => React.ReactNode) => void;
        setStaticComponent: (c: (props: {
        data: any[], children: React.ReactNode, 
        Component: React.ComponentType<any>,
        WidgetMap: React.ComponentType<any>,
        MapComponent: React.ComponentType<any>,
        mapProps: any,
        }) => React.ReactNode) => void;
        setSearch: (s: any) => void;
        user: {
          id: string;
          name: string;
        };
        Link: (props: {href: string}) => React.ReactNode;
        pages: {
          id: string
          title: string
          url: string
        }[];
        router: any;
        context: any;
        Head: any;
      }
        `,
  },
};

export const getReactTemplateDefinition = (template: string, code: string, data: any) => {
  let result = '';
  Object.keys(data).forEach((i) => {
    result += `const ${i} = data.${i};\n`;
  });
  return result + reactTemplates[template].definition.replace('{resultCode}', code);
};

export const getReactTemplateType = (template: string) => reactTemplates[template].type;
