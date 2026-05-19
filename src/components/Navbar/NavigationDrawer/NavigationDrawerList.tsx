import React, { useCallback } from 'react';

import useTranslation from 'next-translate/useTranslation';
import { useDispatch } from 'react-redux';

import NavigationDrawerItem from './NavigationDrawerItem';

import useGetContinueReadingUrl from '@/hooks/useGetContinueReadingUrl';
import IconAbout from '@/icons/about.svg';
import IconBookmarkFilled from '@/icons/bookmark_filled.svg';
import IconCode from '@/icons/code.svg';
import DiamondIcon from '@/icons/diamond.svg';
import IconHeadphonesFilled from '@/icons/headphones-filled.svg';
import IconHome from '@/icons/home.svg';
import IconSchool from '@/icons/school.svg';
import { setIsNavigationDrawerOpen } from '@/redux/slices/navbar';
import Language from '@/types/Language';
import { logButtonClick } from '@/utils/eventLogger';
import {
  ABOUT_US_URL,
  DEVELOPERS_URL,
  getMyQuranNavigationUrl,
  LEARNING_PLANS_URL,
  RECITERS_URL,
  ROUTES,
} from '@/utils/navigation';

const NavigationDrawerList: React.FC = () => {
  const { lang, t } = useTranslation('common');
  const dispatch = useDispatch();
  const continueReadingUrl = useGetContinueReadingUrl();

  const ITEMS = [
    {
      title: 'Ramadan 2026',
      icon: <DiamondIcon />,
      href: ROUTES.RAMADAN_2026,
      eventName: 'navigation_drawer_ramadan2026',
      isEvent: true,
      locale: Language.EN,
    },
    {
      title: t('read'),
      icon: <IconHome />,
      href: continueReadingUrl,
      eventName: 'navigation_drawer_read',
    },
    {
      title: t('learn'),
      icon: <IconSchool />,
      href: LEARNING_PLANS_URL,
      eventName: 'navigation_drawer_learn',
    },
    {
      title: t('my-quran'),
      icon: <IconBookmarkFilled />,
      href: getMyQuranNavigationUrl(),
      eventName: 'navigation_drawer_my_quran',
    },
    {
      title: t('reciters'),
      icon: <IconHeadphonesFilled />,
      href: RECITERS_URL,
      eventName: 'navigation_drawer_reciters',
    },
    {
      title: t('developers'),
      icon: <IconCode />,
      href: DEVELOPERS_URL,
      eventName: 'navigation_drawer_developers',
    },
    {
      title: t('about'),
      icon: <IconAbout />,
      href: ABOUT_US_URL,
      eventName: 'navigation_drawer_about',
    },
  ];

  const handleItemClick = useCallback(
    (eventName: string) => {
      dispatch(setIsNavigationDrawerOpen(false));
      logButtonClick(eventName);
    },
    [dispatch],
  );

  return (
    <>
      {ITEMS.map((item) => {
        if (item.locale && lang !== item.locale) {
          return null;
        }
        return (
          <NavigationDrawerItem
            key={item.eventName}
            title={item.title}
            icon={item.icon}
            href={item.href}
            onClick={() => handleItemClick(item.eventName)}
            isEvent={item.isEvent}
          />
        );
      })}
    </>
  );
};

export default NavigationDrawerList;
