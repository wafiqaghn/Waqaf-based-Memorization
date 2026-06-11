import useTranslation from 'next-translate/useTranslation';

import styles from './TartilaPracticeCards.module.scss';

const CARD_KEYS = ['waqaf', 'repeat', 'highlight', 'baqarah'] as const;

const TartilaPracticeCards = () => {
  const { t } = useTranslation('home');

  return (
    <section className={styles.section} aria-labelledby="tartila-practice-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('practice.eyebrow')}</p>
          <h2 id="tartila-practice-title" className={styles.title}>
            {t('practice.title')}
          </h2>
        </div>
        <p className={styles.subtitle}>{t('practice.subtitle')}</p>
      </div>
      <div className={styles.grid}>
        {CARD_KEYS.map((key, index) => (
          <article className={styles.card} key={key}>
            <span className={styles.index}>{index + 1}</span>
            <h3 className={styles.cardTitle}>{t(`practice.cards.${key}.title`)}</h3>
            <p className={styles.cardCopy}>{t(`practice.cards.${key}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TartilaPracticeCards;
