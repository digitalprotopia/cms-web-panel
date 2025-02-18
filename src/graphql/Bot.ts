import { gql } from '@apollo/client'

export const GET_BOT_QUERY = gql`
    query GetBot($id: ID!) {
        getBot(id: $id) {
            id
            name
            title
            favicon
            url
            apiKey
            platformID
            idInPlatform
            clientId
        }
    }
`

export const EDIT_BOT_MUTATION = gql`
    mutation EditBot($id: ID!, $input: BotInput!) {
        editBot(id: $id, input: $input) {
            id
            name
            title
            favicon
            url
            apiKey
            platformID
            idInPlatform
            clientId
        }
    }
`

export const GET_BOT_PAGES_QUERY = gql`
    query GetBotItems($botId: ID!) {
            getBotPages(botId: $botId) {
                id
                title
        }
    }
`

export const GET_PAGE_QUERY = gql`
    query GetBotItem($id: ID!) {
        getPage(id: $id) {
            id
            title
        }
    }
`

export const EDIT_PAGE_MUTATION = gql`
    mutation EditBotItem($id: ID!, $input: ItemInput!) {
        editPage(id: $id, input: $input) {
            id
            title
        }
    }
`