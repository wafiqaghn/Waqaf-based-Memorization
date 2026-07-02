
import useTranslation from 'next-translate/useTranslation';
import { useDispatch, useSelector } from 'react-redux';

import BottomActionsTabs, { TabId } from './BottomActionsTabs';

import { StudyModeTabId } from '@/components/QuranReader/ReadingView/StudyModeModal/StudyModeBottomActions';
import BookIcon from '@/icons/book-open.svg';
import { openStudyMode } from '@/redux/slices/QuranReader/studyMode';
import { selectSelectedTafsirs } from '@/redux/slices/QuranReader/tafsirs';
import { logButtonClick } from '@/utils/eventLogger';
import { fakeNavigate, getVerseSelectedTafsirNavigationUrl } from '@/utils/navigation';
import { getVerseAndChapterNumbersFromKey } from '@/utils/verse';

/**
 * Props for the BottomActions component
 */
interface BottomActionsProps {
  /**
   * The verse key to display actions for
   */
  verseKey: string;
  /**
   * Whether this is in translation view
   */
  isTranslationView?: boolean;
  /**
   * The class name to apply to the bottom actions container
   */
  className?: string;
}

/**
 * BottomActions component displays action tabs for a verse
 * @param {BottomActionsProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
const BottomActions = ({
  verseKey,
  isTranslationView = true,
  className,
}: BottomActionsProps): JSX.Element => {
  const { t, lang } = useTranslation('common');
  const dispatch = useDispatch();
  const tafsirs = useSelector(selectSelectedTafsirs);
  const [chapterId, verseNumber] = getVerseAndChapterNumbersFromKey(verseKey);

  const createTabHandler = (tabType: TabId, navigationFn: () => string) => {
    return () => {
      const tabIdMap: Partial<Record<TabId, StudyModeTabId>> = {
        [TabId.TAFSIR]: StudyModeTabId.TAFSIR,
      };

      const studyModeTab = tabIdMap[tabType];
      if (studyModeTab) {
        dispatch(openStudyMode({ verseKey, activeTab: studyModeTab }));
      }

      logButtonClick(
        `${
          isTranslationView ? 'translation_view' : 'reading_view'
        }_verse_bottom_actions_${tabType}`,
      );

      fakeNavigate(navigationFn(), lang);
    };
  };

  // Define tab configurations
  const tabs = [
    {
      id: TabId.TAFSIR,
      label: t('quran-reader:tafsirs'),
      icon: <BookIcon />,
      onClick: createTabHandler(TabId.TAFSIR, () =>
        getVerseSelectedTafsirNavigationUrl(chapterId, Number(verseNumber), tafsirs[0]),
      ),
      condition: true,
    },
  ];

  return (
    <BottomActionsTabs tabs={tabs} isTranslationView={isTranslationView} className={className} />
  );
};

export default BottomActions;
