import { createContext } from 'react';
import { IUser } from './entities/IUser';
import { ISiteItem } from './entities/ISiteItem';

const UserContext = createContext<{ user: IUser | null,
  pages: ISiteItem[] | null
  refetch:() => Promise<void> }>({
    user: null,
    pages: null,
    refetch: async () => {},
  });

export default UserContext;
