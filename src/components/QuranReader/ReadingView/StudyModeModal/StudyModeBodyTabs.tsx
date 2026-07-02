/* eslint-disable max-lines */
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { StudyModeTabId } from './StudyModeBottomActions';

import TafsirSkeleton from '@/components/QuranReader/TafsirView/TafsirSkeleton';
import BookIcon from '@/icons/book-open.svg';

const Loading = () => <TafsirSkeleton />;

export const StudyModeTafsirTab = dynamic(() => import('./tabs/StudyModeTafsirTab'), {
  loading: Loading,
});

interface TabProps {
  chapterId: string;
  verseNumber: string;
  switchTab?: (tabId: StudyModeTabId | null) => void;
  tafsirIdOrSlug?: string;
}

export const TAB_COMPONENTS: Partial<Record<StudyModeTabId, React.ComponentType<TabProps>>> = {
  [StudyModeTabId.TAFSIR]: StudyModeTafsirTab,
};

export type TabConfig = {
  id: StudyModeTabId;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  condition: boolean;
};

/**
 * Hook to generate tab configuration for StudyModeBottomActions.
 * @returns {TabConfig[]} Array of tab configurations
 */
export const useStudyModeTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: StudyModeTabId | null | undefined;
  onTabChange?: (tabId: StudyModeTabId | null) => void;
}): TabConfig[] => {
  const { t } = useTranslation('common');

  const handleTabClick = (tabId: StudyModeTabId) => {
    const newTab = activeTab === tabId ? null : tabId;
    onTabChange?.(newTab);
  };

  return [
    {
      id: StudyModeTabId.TAFSIR,
      label: t('quran-reader:tafsirs'),
      icon: <BookIcon color="var(--color-blue-buttons-and-icons)" />,
      onClick: () => handleTabClick(StudyModeTabId.TAFSIR),
      condition: true,
    },
  ];
};
