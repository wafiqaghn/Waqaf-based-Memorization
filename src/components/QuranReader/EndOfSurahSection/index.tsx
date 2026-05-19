import React from 'react';

import useTranslation from 'next-translate/useTranslation';
import { useSelector } from 'react-redux';

import styles from './EndOfSurahSection.module.scss';
import StreakGoalCard from './StreakGoalCard';

import Link from '@/dls/Link/Link';
import { selectIsReadingByRevelationOrder } from '@/redux/slices/revelationOrder';
import { getNextChapterNumber } from '@/utils/chapter';
import EventName from '@/utils/event-names';
import { logButtonClick } from '@/utils/eventLogger';
import { getSurahNavigationUrl } from '@/utils/navigation';

interface EndOfSurahSectionProps {
  chapterNumber: number;
}

const EndOfSurahSection: React.FC<EndOfSurahSectionProps> = ({ chapterNumber }) => {
  const { t } = useTranslation('quran-reader');
  const isReadingByRevelationOrder = useSelector(selectIsReadingByRevelationOrder);

  const nextChapterId = getNextChapterNumber(chapterNumber, isReadingByRevelationOrder);

  const handleCtaClick = () => {
    logButtonClick(EventName.QURAN_READER_END_OF_SURAH_CTA);
  };

  return (
    <div className={styles.container} data-testid="end-of-surah-section">
      <div className={styles.ctaContainer}>
        <h2 className={styles.header}>{t('end-of-surah.header')}</h2>
        {nextChapterId && (
          <Link
            onClick={handleCtaClick}
            href={getSurahNavigationUrl(nextChapterId)}
            className={styles.cta}
          >
            {t('end-of-surah.cta')}
          </Link>
        )}
      </div>

      <div className={styles.cardsGrid}>
        <StreakGoalCard cardClassName={styles.card} />
      </div>
    </div>
  );
};

export default EndOfSurahSection;
