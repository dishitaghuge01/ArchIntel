import { useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { UploadScreen } from '@/components/UploadScreen';
import { AnalysisView } from '@/components/AnalysisView';
import { LoadingAnalysis } from '@/components/LoadingAnalysis';
import { useAppStore } from '@/lib/store';

const Index = () => {
  const { plans, activePlanId, isAnalyzing, settings } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const activePlan = activePlanId
    ? plans.find((p) => p.id === activePlanId) ?? null
    : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isAnalyzing ? (
          <LoadingAnalysis />
        ) : activePlan ? (
          <AnalysisView planId={activePlanId!} />
        ) : (
          <UploadScreen />
        )}
      </main>
    </div>
  );
};

export default Index;
