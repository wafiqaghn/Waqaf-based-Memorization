/* eslint-disable react/no-multi-comp */
import React from 'react';

import useTranslation from 'next-translate/useTranslation';

import styles from './AudioCard.module.scss';
import useAudioCardState, { AudioCardState } from './useAudioCardState';

import Spinner, { SpinnerSize } from '@/components/dls/Spinner/Spinner';
import Card from '@/components/HomePage/Card';
import BackwardIcon from '@/icons/backward.svg';
import CloseIcon from '@/icons/close.svg';
import ForwardIcon from '@/icons/forward.svg';
import PauseIcon from '@/icons/pause.svg';
import PlayIcon from '@/icons/play-arrow.svg';
import { secondsFormatter } from '@/utils/datetime';
import { logButtonClick } from '@/utils/eventLogger';

type Props = {
  surahNumber: number;
};

const stopCardNavigation = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

const AudioCard: React.FC<Props> = ({ surahNumber }) => {
  const audio = useAudioCardState(surahNumber);
  return (
    <Card className={styles.audioCard}>
      <AudioHeader chapterName={audio.chapterName} isActive={audio.isCurrentChapter} />
      <PlayerControls audio={audio} />
      <Timeline audio={audio} />
    </Card>
  );
};

const AudioHeader = ({ chapterName, isActive }: { chapterName: string; isActive: boolean }) => {
  const { t } = useTranslation('common');
  return (
    <div className={styles.header}>
      <div>
        <p className={styles.eyebrow}>{t('audio.title')}</p>
        <h2>{chapterName}</h2>
      </div>
      <div className={styles.nowPlaying} data-active={isActive}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

const PlayerControls = ({ audio }: { audio: AudioCardState }) => (
  <div className={styles.controls}>
    <IconButton
      label={audio.t('previous-ayah')}
      onClick={(event) => {
        stopCardNavigation(event);
        audio.audioService.send('PREV_AYAH');
      }}
      isDisabled={!audio.isCurrentChapter || audio.isLoading}
    >
      <BackwardIcon />
    </IconButton>
    <PrimaryButton audio={audio} />
    <IconButton
      label={audio.t('next-ayah')}
      onClick={(event) => {
        stopCardNavigation(event);
        audio.audioService.send('NEXT_AYAH');
      }}
      isDisabled={!audio.isCurrentChapter || audio.isLoading}
    >
      <ForwardIcon />
    </IconButton>
    <IconButton
      label={audio.t('audio.player.close-audio-player')}
      onClick={(event) => {
        stopCardNavigation(event);
        audio.audioService.send('CLOSE');
      }}
      isDisabled={!audio.isCurrentChapter}
    >
      <CloseIcon />
    </IconButton>
  </div>
);

const PrimaryButton = ({ audio }: { audio: AudioCardState }) => {
  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopCardNavigation(event);
    logButtonClick(audio.isCurrentChapter ? 'homepage_audio_toggle' : 'homepage_audio_play');
    audio.audioService.send(
      audio.isCurrentChapter ? 'TOGGLE' : { type: 'PLAY_SURAH', surah: audio.surahNumber },
    );
  };
  const label =
    audio.isPlaying && audio.isCurrentChapter
      ? audio.t('audio.player.pause')
      : audio.t('audio.player.play');
  return (
    <button type="button" className={styles.pauseButton} onClick={onClick} aria-label={label}>
      {getPrimaryIcon(audio)}
    </button>
  );
};

const getPrimaryIcon = (audio: AudioCardState) => {
  if (audio.isLoading) {
    return <Spinner className={styles.spinner} size={SpinnerSize.Small} />;
  }
  if (audio.isPlaying && audio.isCurrentChapter) {
    return <PauseIcon />;
  }
  return <PlayIcon />;
};

type IconButtonProps = {
  children: React.ReactNode;
  isDisabled: boolean;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const IconButton: React.FC<IconButtonProps> = ({ children, isDisabled, label, onClick }) => (
  <button
    type="button"
    className={styles.iconButton}
    onClick={onClick}
    aria-label={label}
    disabled={isDisabled}
  >
    {children}
  </button>
);

const Timeline = ({ audio }: { audio: AudioCardState }) => {
  const max = Math.max(audio.duration || 0, 0);
  const value = audio.isCurrentChapter ? Math.min(audio.elapsed || 0, max) : 0;
  return (
    <div className={styles.timeline}>
      <span>{secondsFormatter(value, audio.lang)}</span>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        aria-label={audio.t('audio.player.play-range')}
        disabled={!audio.isCurrentChapter || max === 0}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onChange={(event) =>
          audio.audioService.send({ type: 'SEEK_TO', timestamp: Number(event.target.value) })
        }
      />
      <span>{secondsFormatter(max, audio.lang)}</span>
    </div>
  );
};

export default AudioCard;
