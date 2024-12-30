import { ISite } from '@/components/entities/ISite';
import { ISiteMenu } from '@/components/entities/ISiteMenu';
import SiteMenuList from '@/components/navigation/SiteMenuList';
import { useQuery, gql } from '@apollo/client';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const GET_ALL_SITES = gql`
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

const GET_SITE_MENUS = gql`
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
      }
      createdAt
      updatedAt
    }
  }
`;

export default function NavigationPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const { data: sitesData, loading: sitesLoading } = useQuery<{
    getAllSites: ISite[];
  }>(GET_ALL_SITES);

  const { data: menusData, loading: menusLoading } = useQuery<{
    getSiteMenus: ISiteMenu[];
  }>(GET_SITE_MENUS, {
    variables: { siteId: selectedSiteId },
    skip: !selectedSiteId,
  });

  const defaultMenu = menusData?.getSiteMenus.find(
    (menu) => menu.name === 'default',
  );
  const otherMenus = menusData?.getSiteMenus.filter((menu) => menu.name !== 'default') || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Навигация
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Выберите сайт</InputLabel>
        <Select
          value={selectedSiteId}
          label="Выберите сайт"
          onChange={(e) => setSelectedSiteId(e.target.value)}
          disabled={sitesLoading}
        >
          {sitesData?.getAllSites.map((site) => (
            <MenuItem key={site.id} value={site.id}>
              {site.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedSiteId && (
        <>
          {defaultMenu && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Основное меню
              </Typography>
              <SiteMenuList
                siteId={selectedSiteId}
                menus={[defaultMenu]}
                loading={menusLoading}
                isDefaultMenu
              />
            </Box>
          )}

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Дополнительные меню
            </Typography>
            <SiteMenuList
              siteId={selectedSiteId}
              menus={otherMenus}
              loading={menusLoading}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
