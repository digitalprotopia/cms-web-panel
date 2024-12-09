import { createContext } from 'react';
import { IUser } from './entities/IUser';

const UserContext = createContext<{ user: IUser | null, refetch:() => Promise<void> }>({
  user: null,
  refetch: async () => {},
});

export default UserContext;
