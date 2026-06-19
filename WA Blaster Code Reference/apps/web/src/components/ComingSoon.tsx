import { Page, PageHead, Empty } from './ui/Card';
import { IcActivity } from './ui/icons';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <Page>
      <PageHead title={title} />
      <Empty icon={<IcActivity size={20} />} title="Coming soon"
        body="This area isn't built yet. The navigation and layout are in place ahead of the backend." />
    </Page>
  );
}
