import React from 'react';

import classNames from 'classnames';

import ExploreTopicsSection from '../ExploreTopicsSection';
import QuranInYearSection from '../QuranInYearSection';

import styles from '@/pages/index.module.scss';
import ChaptersData from 'types/ChaptersData';

type Props = {
  isUserLoggedIn: boolean;
  todayAyah: { chapter: number; verse: number } | null;
  chaptersData?: ChaptersData;
};

const MobileHomepageSections: React.FC<Props> = ({ isUserLoggedIn, todayAyah, chaptersData }) => {
  return isUserLoggedIn ? (
    <>
      {todayAyah && (
        <div className={classNames(styles.flowItem, styles.fullWidth, styles.homepageCard)}>
          <QuranInYearSection chaptersData={chaptersData} />
        </div>
      )}
      <div className={classNames(styles.flowItem, styles.fullWidth, styles.homepageCard)}>
        <ExploreTopicsSection />
      </div>
    </>
  ) : (
    <>
      <div className={classNames(styles.flowItem, styles.fullWidth, styles.homepageCard)}>
        <ExploreTopicsSection />
      </div>
      {todayAyah && (
        <div className={classNames(styles.flowItem, styles.fullWidth, styles.homepageCard)}>
          <QuranInYearSection chaptersData={chaptersData} />
        </div>
      )}
    </>
  );
};

export default MobileHomepageSections;
