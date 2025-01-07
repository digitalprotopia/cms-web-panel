import { gql } from '@apollo/client';

export const GET_SITE_MENUS = gql`
  query GetSiteMenus($siteId: ID!) {
    getSiteMenus(siteId: $siteId) {
      id
      name
      title
      items {
        id
        title
        url
        order
        parentId
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SITE_MENU = gql`
  mutation CreateSiteMenu($input: SiteMenuInput!) {
    createSiteMenu(input: $input) {
      id
      name
      title
      siteId
      createdAt
    }
  }
`;

export const EDIT_SITE_MENU = gql`
  mutation EditSiteMenu($id: ID!, $input: SiteMenuInput!) {
    editSiteMenu(id: $id, input: $input) {
      id
      name
      title
      siteId
      updatedAt
    }
  }
`;

export const DELETE_SITE_MENU = gql`
  mutation DeleteSiteMenu($id: ID!) {
    deleteSiteMenu(id: $id)
  }
`;
