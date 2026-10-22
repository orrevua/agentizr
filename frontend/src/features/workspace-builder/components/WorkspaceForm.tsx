'use client';

import { FormProvider } from 'react-hook-form';
import { Download, Eye, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { WorkflowController } from '@/features/workflow/components/WorkflowController';
import { useGenerateMutation } from '@/features/preview/api/useGenerateMutation';
import { usePreviewMutation } from '@/features/preview/api/usePreviewMutation';
import { useDownloadZip } from '@/features/preview/hooks/useDownloadZip';
import type { GenerationResult } from '@/features/preview/types';
import { useAgentTabsController } from '../hooks/useAgentTabsController';
import { useSlugFromName } from '../hooks/useSlugFromName';
import { useWorkspaceForm } from '../hooks/useWorkspaceForm';
import { AgentTabPanel } from './AgentTabPanel';
import { AgentTabs } from './AgentTabs';
import { OutputLanguageField } from './OutputLanguageField';
import { OutputModeRadio } from './OutputModeRadio';
import { PlatformSelector } from './PlatformSelector';
import { PresetPicker } from './PresetPicker';
import { ScopeRadio } from './ScopeRadio';
import { SkillsSection } from './SkillsSection';

interface Props {
  onPreviewResult: (
    result: GenerationResult | null,
    isLoading: boolean,
    error: string | null,
  ) => void;
}

export function WorkspaceForm({ onPreviewResult }: Props) {
  const t = useTranslations('common');
  const tErr = useTranslations('errors');
  const tForm = useTranslations('form');
  const tWs = useTranslations('workspace');
  const form = useWorkspaceForm();
  useSlugFromName(form);
  const tabs = useAgentTabsController(form);
  const basePath = `agents.${tabs.activeIndex}` as const;

  const previewMutation = usePreviewMutation();
  const generateMutation = useGenerateMutation();
  const downloadZip = useDownloadZip();

  const onPreview = form.handleSubmit(
    (values) => {
      onPreviewResult(null, true, null);
      previewMutation.mutate(values, {
        onSuccess: (data) => onPreviewResult(data, false, null),
        onError: (e) => onPreviewResult(null, false, e.message),
      });
    },
    () => onPreviewResult(null, false, tErr('validationFailed')),
  );

  const onGenerate = form.handleSubmit(
    (values) => {
      generateMutation.mutate(values, {
        onSuccess: ({ blob, filename }) => downloadZip(blob, filename),
      });
    },
    () => onPreviewResult(null, false, tErr('validationFailed')),
  );

  return (
    <FormProvider {...form}>
      <form className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <OutputLanguageField control={form.control} />
          <PlatformSelector control={form.control} basePath={basePath} />
          <ScopeRadio control={form.control} basePath={basePath} />
          <OutputModeRadio />
        </aside>

        <main className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {tWs('agentsSection')}
            </h2>
            <PresetPicker form={form} activeIndex={tabs.activeIndex} />
          </div>

          <AgentTabs
            form={form}
            fields={tabs.fields}
            activeIndex={tabs.activeIndex}
            setActiveIndex={tabs.setActiveIndex}
            onAdd={tabs.add}
            onRemove={tabs.remove}
            onRename={tabs.rename}
            canAdd={tabs.canAdd}
            canRemove={tabs.canRemove}
          />

          <div>
            <div className="mb-2 text-xs uppercase text-[var(--color-muted-foreground)]">
              {tForm('sectionDefinition')}
            </div>
            <AgentTabPanel control={form.control} index={tabs.activeIndex} />
          </div>

          <WorkflowController onAddAgent={tabs.add} canAdd={tabs.canAdd} />

          <SkillsSection />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onPreview}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {previewMutation.isPending ? t('previewing') : t('preview')}
            </Button>
            <Button type="button" onClick={onGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {generateMutation.isPending ? t('generating') : t('generate')}
            </Button>
          </div>
        </main>
      </form>
    </FormProvider>
  );
}
