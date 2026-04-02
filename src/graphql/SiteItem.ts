import { gql } from '@apollo/client';

// eslint-disable-next-line import/prefer-default-export
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
      metaTitle
      metaDescription
      metaKeywords
    }
  }
`;
