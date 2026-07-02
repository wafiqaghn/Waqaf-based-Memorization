/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import classNames from 'classnames';
import { NextPage, GetStaticProps } from 'next';
import useTranslation from 'next-translate/useTranslation';

import styles from './index.module.scss';

import ChapterAndJuzListWrapper from '@/components/chapters/ChapterAndJuzList';
import HomePageHero from '@/components/HomePage/HomePageHero';
import ReadingSection from '@/components/HomePage/ReadingSection';
import TartilaPracticeCards from '@/components/HomePage/TartilaPracticeCards';
import NextSeoWrapper from '@/components/NextSeoWrapper';
import { getAllChaptersData } from '@/utils/chapter';
import { getLanguageAlternates } from '@/utils/locale';
import { getCanonicalUrl } from '@/utils/navigation';
import { ChaptersResponse } from 'types/ApiResponses';
import ChaptersData from 'types/ChaptersData';

type IndexProps = {
  chaptersResponse: ChaptersResponse;
  chaptersData: ChaptersData;
};

const Index: NextPage<IndexProps> = ({
  chaptersResponse: { chapters },
}): JSX.Element => {
  const { t, lang } = useTranslation('home');

  return (
    <>
      <NextSeoWrapper
        title={t('meta.title')}
        description={t('meta.description')}
        url={getCanonicalUrl(lang, '')}
        languageAlternates={getLanguageAlternates('')}
      />
      <div className={styles.pageContainer}>
        <div className={styles.flow}>
          <HomePageHero />
          <TartilaPracticeCards />
          <div className={styles.bodyContainer}>
            <div
              className={classNames(
                styles.flowItem,
                styles.fullWidth,
                styles.homepageCard,
                styles.readingCard,
              )}
            >
              <ReadingSection />
            </div>

            <div className={classNames(styles.flowItem, styles.chapterListSection)}>
              <div className={styles.sectionIntro}>
                <p>{t('surah-list.eyebrow')}</p>
                <h2>{t('surah-list.title')}</h2>
              </div>
              <ChapterAndJuzListWrapper chapters={chapters} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const allChaptersData = await getAllChaptersData(locale);

  return {
    props: {
      chaptersData: allChaptersData,
      chaptersResponse: {
        chapters: Object.keys(allChaptersData).map((chapterId) => {
          const chapterData = allChaptersData[chapterId];
          return { ...chapterData, id: Number(chapterId) };
        }),
      },
    },
  };
};

export default Index;
