const reactTemplates: Record<string, { definition: string, type: string }> = {
  list: {
    definition: `
        const { React, Mui, Link, user, pages, useTableByDbName } = data;
      let filter = null;
      const result = { 
      }
      const MMCMS = {
        setFilter: (f) => {
          filter = f;
        },
        setComponent: (c) => {
          result.Component = c;
        },
        setListComponent: (c) => {
          result.ListComponent = c;
        },
        user: data.user,
        pages: data.pages,
        Link: data.Link,
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
        setListComponent: (c: (props: {data: any[], children: React.ReactNode, Component: React.ComponentType<any>}) => React.ReactNode) => void;
        user: {
          id: string;
          name: string;
        };
        Link: (props: {href: string}) => React.ReactNode;
        pages: {
          id: string
          title: string
          url: string
        }[]
      }
        `,
  },
};

export const getReactTemplateDefinition = (template: string, code: string) => reactTemplates[template].definition.replace('{resultCode}', code);

export const getReactTemplateType = (template: string) => reactTemplates[template].type;
