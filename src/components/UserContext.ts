import { createContext } from 'react';
import { IUser } from './entities/IUser';
import { ISiteItem } from './entities/ISiteItem';

export interface UserContextData {
  user: IUser | null,
  pages: ISiteItem[] | null
  currentPage?: ISiteItem | null
  setCurrentPage?: (page: ISiteItem | null) => void
  refetch:() => Promise<void>
}

const UserContext = createContext<UserContextData>({
  user: null,
  pages: null,
  refetch: async () => {},
});

export default UserContext;
