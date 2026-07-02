import useTranslation from 'next-translate/useTranslation';

import styles from './NavbarLogoWrapper.module.scss';

import Link from '@/dls/Link/Link';

const NavbarLogoWrapper = () => {
  const { t } = useTranslation('common');
  return (
    <Link href="/" className={styles.logoWrapper} title={t('quran-com')}>
      <span className={styles.logoMark}>{t('quran-com').charAt(0)}</span>
      <span className={styles.logoText}>{t('quran-com')}</span>
    </Link>
  );
};

export default NavbarLogoWrapper;
