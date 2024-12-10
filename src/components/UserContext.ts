import { createContext } from 'react';
import { IUser } from './entities/IUser';
import { IPage } from './entities/IPage';

const UserContext = createContext<{ user: IUser | null,
  pages: IPage[] | null
  refetch:() => Promise<void> }>({
    user: null,
    pages: null,
    refetch: async () => {},
  });

export default UserContext;
