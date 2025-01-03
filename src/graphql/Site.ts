import { gql } from '@apollo/client';

export const GET_ALL_SITES = gql`
  query GetAllSites {
    getAllSites {
      id
      title
      favicon
      domain
      templateGroupId
      menus {
        id
        name
        title
      }
      createdAt
      updatedAt
    }
  }
`;
