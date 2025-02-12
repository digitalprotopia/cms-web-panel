import { Button, ButtonGroup } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';

function TemplateGroupMenu() {
  const router = useRouter();

  return (
    <ButtonGroup variant="outlined">
      <Link href={`/admin/templateGroups/${router.query.id}`}>
        <Button>Шаблон</Button>
      </Link>
      <Link href={`/admin/templateGroups/${router.query.id}/head`}>
        <Button>Head</Button>
      </Link>
      <Link href={`/admin/templateGroups/${router.query.id}/files`}>
        <Button>Файлы</Button>
      </Link>
    </ButtonGroup>
  );
}

export default TemplateGroupMenu;
