import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/shared/ui/header';
import { WorkspaceBuilder } from '@/features/workspace-builder/components/WorkspaceBuilder';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <WorkspaceBuilder />
      </main>
    </>
  );
}
