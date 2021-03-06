import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import RichText from '../components/RichText';

export default function Page({ wagtail }: { wagtail: any }) {
  return <RichText data={wagtail.text} />;
}

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<any>> {
  const result = await fetch(
    `http://localhost:8000/api/v2/pages/find/?html_path=${context.resolvedUrl}`,
  );
  const wagtail = await result.json();

  return {
    props: { wagtail },
  };
}
