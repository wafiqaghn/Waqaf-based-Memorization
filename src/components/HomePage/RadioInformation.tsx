/* eslint-disable i18next/no-literal-string */
import { useActor } from '@xstate/react';
import useTranslation from 'next-translate/useTranslation';

import styles from './PlayRadioButton.module.scss';

import useCurrentStationInfo from 'src/xstate/Radio/useCurrentStationInfo';

const RadioInformation = ({ radioActor }) => {
  const [state] = useActor(radioActor);

  const stationInfo = useCurrentStationInfo((state as any).context);
  const { t } = useTranslation('radio');

  return (
    <div className={styles.stationInfo}>
      <span className={styles.stationTitle}>
        <span className={styles.station}>{t('station')}</span>: {stationInfo.title}
      </span>
    </div>
  );
};

export default RadioInformation;
