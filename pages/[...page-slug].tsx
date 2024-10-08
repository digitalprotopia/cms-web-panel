import { useRouter } from 'next/router';

export default function Page() {
  const router = useRouter();

  return (
    <div>
      <h1>
        Page Slug:
        {(router.query['page-slug'] as string[]).join('/')}
      </h1>
    </div>
  );
}
