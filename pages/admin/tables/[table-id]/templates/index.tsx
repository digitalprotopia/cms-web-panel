import { Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function Templates() {
  const router = useRouter();
  return (
    <div>
      <Button onClick={() => router.push(`/admin/tables/${router.query['table-id']}/templates/add`)}>Add</Button>
    </div>
  );
}
