import { createContext } from 'react';
import { IUser } from './entities/IUser';
import { ISiteItem } from './entities/ISiteItem';
import { ISite } from './entities/ISite';

export interface UserContextData {
  user: IUser | null,
  pages: ISiteItem[] | null
  site: ISite | any | null,
  currentPage?: ISiteItem | null
  loaded: boolean
  setLoaded: (loaded: boolean) => void
  setCurrentPage?: (page: ISiteItem | null) => void
  refetch:() => Promise<void>
  logout:() => void
}

const UserContext = createContext<UserContextData>({
  user: null,
  pages: null,
  site: null,
  loaded: false,
  setLoaded: () => {},
  refetch: async () => {},
  logout: () => {},
});

export default UserContext;
