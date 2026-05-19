/* eslint-disable i18next/no-literal-string */
import { useMemo } from 'react';

import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { PopoverMenuExpandDirection } from '../PopoverMenu/PopoverMenu';

import styles from './Footer.module.scss';

import LanguageSelector from '@/components/Navbar/LanguageSelector';
import Link, { LinkVariant } from '@/dls/Link/Link';
import Spinner from '@/dls/Spinner/Spinner';
import { toLocalizedDate } from '@/utils/locale';
import { ROUTES } from '@/utils/navigation';

const FooterThemeSwitcher = dynamic(() => import('./FooterThemeSwitcher'), {
  ssr: false,
  loading: () => <Spinner />,
});

const BottomSection = () => {
  const { t, lang } = useTranslation('common');
  const localizedCurrentYear = useMemo(
    () =>
      toLocalizedDate(new Date(), lang, {
        year: 'numeric',
        calendar: 'gregory',
      }),
    [lang],
  );

  return (
    <div className={styles.bottomSectionContainer}>
      <div>
        <div className={styles.bottomLinks}>
          <Link href={ROUTES.SITEMAP} shouldPrefetch={false} isNewTab>
            {t('sitemap')}
          </Link>
          <Link href={ROUTES.PRIVACY} shouldPrefetch={false} isNewTab>
            {t('privacy')}
          </Link>
          <Link href={ROUTES.TERMS} shouldPrefetch={false} isNewTab>
            {t('terms-and-conditions')}
          </Link>
        </div>
        <div className={styles.copyright}>
          © {localizedCurrentYear}{' '}
          <Link href="https://quran.com" variant={LinkVariant.Highlight} shouldPrefetch={false}>
            {
              // we don't want to localize Quran.com text
              // eslint-disable-next-line i18next/no-literal-string
              'Quran.com'
            }
          </Link>
          . {t('footer.rights')}
        </div>
      </div>
      <div className={styles.actionsSections}>
        <div className={styles.actionContainer} data-testid="theme-switcher">
          <FooterThemeSwitcher />
        </div>
        <div className={styles.actionContainer} data-testid="language-selector">
          <LanguageSelector
            shouldShowSelectedLang
            expandDirection={PopoverMenuExpandDirection.TOP}
          />
        </div>
      </div>
    </div>
  );
};

export default BottomSection;
