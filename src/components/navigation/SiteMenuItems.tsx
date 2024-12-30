import { List, ListItem, ListItemText } from '@mui/material';
import { ISiteMenuItem } from '../entities/ISiteMenuItem';

interface SiteMenuItemsProps {
  items: ISiteMenuItem[];
}

export default function SiteMenuItems({ items }: SiteMenuItemsProps) {
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <List>
      {sortedItems.map((item) => (
        <ListItem key={item.id}>
          <ListItemText primary={item.title} secondary={item.url} />
        </ListItem>
      ))}
    </List>
  );
}
