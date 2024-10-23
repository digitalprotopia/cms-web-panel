import { Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();
  return (
    <div>
      <Button onClick={() => router.push('/admin/tables')}>Tables</Button>
    </div>
  );
}
