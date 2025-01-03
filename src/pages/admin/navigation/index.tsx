import { ISite } from '@/components/entities/ISite';
import { ISiteMenu } from '@/components/entities/ISiteMenu';
import SiteMenuList from '@/components/navigation/SiteMenuList';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useState } from 'react';
import CreateMenuDialog from '@/components/navigation/CreateMenuDialog';

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
        parentId
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_SITE_MENU = gql`
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

export default function NavigationPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const { data: sitesData, loading: sitesLoading } = useQuery<{
    getAllSites: ISite[];
  }>(GET_ALL_SITES);

  const {
    data: menusData,
    loading: menusLoading,
    refetch: refetchMenus,
  } = useQuery<{
    getSiteMenus: ISiteMenu[];
  }>(GET_SITE_MENUS, {
    variables: { siteId: selectedSiteId },
    skip: !selectedSiteId,
  });

  const [createMenu] = useMutation(CREATE_SITE_MENU, {
    onCompleted: () => {
      refetchMenus();
      setIsCreateMenuOpen(false);
    },
  });

  const handleCreateMenu = async (name: string, title: string) => {
    await createMenu({
      variables: {
        input: {
          name,
          title,
          siteId: selectedSiteId,
        },
      },
    });
  };

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
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">Меню сайта</Typography>
            <Button variant="contained" color="primary" onClick={() => setIsCreateMenuOpen(true)}>
              Создать меню
            </Button>
          </Box>

          <SiteMenuList
            siteId={selectedSiteId}
            menus={menusData?.getSiteMenus || []}
            loading={menusLoading}
            refetchMenus={refetchMenus}
          />

          <CreateMenuDialog
            open={isCreateMenuOpen}
            onClose={() => setIsCreateMenuOpen(false)}
            onSubmit={handleCreateMenu}
          />
        </Box>
      )}
    </Box>
  );
}
