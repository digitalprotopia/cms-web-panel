import { gql } from '@apollo/client';

export const GET_SITE_PAGES = gql`
  query GetAllSiteItems {
    getRoles {
      id
      name
    }
    getAllSiteItems {
      id
      name
      title
      url
      parentId
      isRoot
      seotag
      html
      roles {
        id
        name
      }
      type
      createdAt
      updatedAt
    }
  }
`;
