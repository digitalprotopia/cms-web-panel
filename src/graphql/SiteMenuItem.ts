import { gql } from '@apollo/client';

export const CREATE_MENU_ITEM = gql`
  mutation CreateSiteMenuItem($input: SiteMenuItemInput!) {
    createSiteMenuItem(input: $input) {
      id
      title
      url
      parentId
      siteItemId
      position
      createdAt
    }
  }
`;

export const UPDATE_MENU_ITEM = gql`
  mutation UpdateSiteMenuItem($id: ID!, $input: SiteMenuItemInput!) {
    updateSiteMenuItem(id: $id, input: $input) {
      id
      title
      url
      parentId
      position
    }
  }
`;

export const DELETE_MENU_ITEM = gql`
  mutation DeleteSiteMenuItem($id: ID!) {
    deleteSiteMenuItem(id: $id)
  }
`;
