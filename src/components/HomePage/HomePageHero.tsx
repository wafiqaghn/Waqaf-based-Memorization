import Link from 'next/link';
import useTranslation from 'next-translate/useTranslation';

import styles from './HomePageHero.module.scss';

import SearchInput from '@/components/Search/SearchInput';

const HomePageHero = () => {
  const { t } = useTranslation('home');

  return (
    <div className={styles.outerContainer}>
      <div className={styles.innerContainer}>
        <div className={styles.copyColumn}>
          <div className={styles.eyebrow}>{t('hero.eyebrow')}</div>
          <h1 className={styles.title}>{t('hero.title')}</h1>
          <p className={styles.subtitle}>{t('hero.subtitle')}</p>
          <p className={styles.supportingCopy}>{t('hero.supporting-copy')}</p>
          <div className={styles.ctaRow}>
            <Link className={styles.primaryCta} href="/2">
              {t('hero.primary-cta')}
            </Link>
            <Link className={styles.secondaryCta} href="/2">
              {t('hero.secondary-cta')}
            </Link>
          </div>
        </div>
        <div className={styles.practicePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelMark}>{t('hero.mark')}</span>
            <div>
              <p className={styles.panelKicker}>{t('hero.panel-kicker')}</p>
              <h2 className={styles.panelTitle}>{t('hero.panel-title')}</h2>
            </div>
          </div>
          <div className={styles.searchShell}>
            <SearchInput
              placeholder={t('common:command-bar.placeholder')}
              shouldExpandOnClick
              shouldOpenDrawerOnMobile
            />
          </div>
          <div className={styles.segmentPreview} aria-label={t('hero.segment-preview-label')}>
            <span />
            <span />
            <span />
            <span />
          </div>
          <dl className={styles.metrics}>
            <div>
              <dt>{t('hero.metric-mode-label')}</dt>
              <dd>{t('hero.metric-mode-value')}</dd>
            </div>
            <div>
              <dt>{t('hero.metric-repeat-label')}</dt>
              <dd>{t('hero.metric-repeat-value')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default HomePageHero;
