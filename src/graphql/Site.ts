import { gql } from '@apollo/client';

// eslint-disable-next-line import/prefer-default-export
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
