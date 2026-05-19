import { useContext, useMemo } from 'react';

import { useSelector } from '@xstate/react';
import useTranslation from 'next-translate/useTranslation';

import DataContext from '@/contexts/DataContext';
import { getChapterData } from '@/utils/chapter';
import {
  selectIsAudioPlayerVisible,
  selectIsAudioPlaying,
  selectIsLoadingCurrentChapter,
} from '@/xstate/actors/audioPlayer/selectors';
import { AudioPlayerMachineContext } from '@/xstate/AudioPlayerMachineContext';

const useAudioCardState = (surahNumber: number) => {
  const { t, lang } = useTranslation('common');
  const chaptersData = useContext(DataContext);
  const audioService = useContext(AudioPlayerMachineContext);
  const chapterData = useMemo(
    () => getChapterData(chaptersData, surahNumber.toString()),
    [chaptersData, surahNumber],
  );
  const currentSurah = useSelector(audioService, (state) => state.context.surah);
  const elapsed = useSelector(audioService, (state) => state.context.elapsed);
  const duration = useSelector(audioService, (state) => state.context.duration);
  const isVisible = useSelector(audioService, selectIsAudioPlayerVisible);
  const isPlaying = useSelector(audioService, selectIsAudioPlaying);
  const isLoading = useSelector(audioService, (state) =>
    selectIsLoadingCurrentChapter(state, surahNumber),
  );

  return {
    audioService,
    chapterName: chapterData.transliteratedName,
    duration,
    elapsed,
    isCurrentChapter: isVisible && currentSurah === surahNumber,
    isLoading,
    isPlaying,
    lang,
    surahNumber,
    t,
  };
};

export type AudioCardState = ReturnType<typeof useAudioCardState>;

export default useAudioCardState;
