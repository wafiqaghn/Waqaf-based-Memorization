/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable react-func/max-lines-per-function */
/* eslint-disable import/prefer-default-export */
import { ActorRefFrom, assign, createMachine, spawn } from 'xstate';
import { forwardTo, pure, send, sendParent } from 'xstate/lib/actions';

import { createRangeCycleMachine } from '../rangeCycle/rangeCycleMachine';

import type { RepeatMode } from './types';

export type { RepeatMode } from './types';

export const createRepeatMachine = ({
  totalRangeCycle,
  totalVerseCycle,
  verseTimings,
  fromVerseNumber,
  toVerseNumber,
  delayMultiplier,
  repeatMode = 'ayah' as RepeatMode,
  reciterConfig = {},
}) =>
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwAcwEMAuBZTAxgBYCWAdmAHTkAKyA9lKrLAMQT0XVkBu9A1lWSYyMAMIBPAgBsw+YuTCJQaerBLYSnZSAAeiACwGAzJQAcARgAMAVmMWzATmOOrZswBoQExNceVHdwB2CwsbCwMguwA2AF94rzJ6CDgdVAwceVIuWgYmOHgkEFV1TW0i-QQrLx8EaLjYr3SsPEJsqgAzchJYIkgdEo0tMh1Kg0cLSisAJgMbRyC3aKsgoLmaxGMzA0pohetZ6LszNZsEkGbMtsUBtSHy0EqAWlmNhCfogLMbOZsbbbszlm8XiQA */
  createMachine(
    {
      context: {
        verseTimings,
        fromVerseNumber,
        toVerseNumber,
        delayMultiplier,
        repeatMode,
        reciterConfig: reciterConfig ?? {},
        repeatSettings: {
          totalRangeCycle,
          totalVerseCycle,
        },
        rangeCycleActor: null as ActorRefFrom<ReturnType<typeof createRangeCycleMachine>>,
      },
      tsTypes: {} as import('./repeatMachine.typegen').Typegen0,
      id: 'repeatMachine',
      initial: 'inProgress',
      states: {
        inProgress: {
          entry: 'spawnRangeCycleActor',
          on: {
            UPDATE_VERSE_TIMINGS: {
              actions: 'updateVerseTimings',
            },
            TIMESTAMP_UPDATED: {
              actions: 'forwardToRangeCycleActor',
            },
            REPEAT_AYAH: {
              actions: 'repeatAyah',
            },
            REPEAT_SAME_AYAH: {
              actions: 'repeatSameAyah',
            },
            ADVANCE_TO_BOUNDARY: {
              actions: 'forwardAdvanceToBoundary',
            },
            RECALIBRATE_BOUNDARY: {
              actions: 'forwardRecalibrateBoundary',
            },
            SET_REPEAT_MODE: {
              actions: 'setRepeatMode',
            },
            RANGE_REPEAT_FINISHED: {
              target: 'finished',
            },
            REPEAT_NEXT_AYAH: {
              actions: 'repeatNextAyah',
            },
            REPEAT_PREV_AYAH: {
              actions: 'repeatPreviousAyah',
            },
            REPEAT_SELECTED_AYAH: [
              {
                cond: 'selectedAyahIsNotInRange',
                target: 'finished',
              },
              {
                actions: 'repeatSelectedAyah',
              },
            ],
          },
        },
        finished: {
          type: 'final',
          entry: 'sendRepeatFinished',
        },
      },
    },
    {
      guards: {
        selectedAyahIsNotInRange: (context, event: any) => {
          const { ayahNumber } = event;
          return ayahNumber < fromVerseNumber || ayahNumber > toVerseNumber;
        },
      },
      actions: {
        setRepeatMode: assign({
          repeatMode: (_context, event: { type: 'SET_REPEAT_MODE'; mode: RepeatMode }) => event.mode,
        }),
        repeatSelectedAyah: pure((context, event: any) => {
          return send(
            { type: 'REPEAT_SELECTED_AYAH', ayahNumber: event.ayahNumber },
            { to: context.rangeCycleActor.id },
          );
        }),
        repeatNextAyah: pure(() => {
          return send({ type: 'REPEAT_NEXT_AYAH' }, { to: (context) => context.rangeCycleActor });
        }),
        repeatPreviousAyah: pure(() => {
          return send({ type: 'REPEAT_PREV_AYAH' }, { to: (context) => context.rangeCycleActor });
        }),
        sendRepeatFinished: sendParent({ type: 'REPEAT_FINISHED' }),
        repeatAyah: pure((context, event: any) => {
          const verseDelay = event.verseDuration * context.delayMultiplier;
          return sendParent({
            type: 'REPEAT_AYAH',
            ayahNumber: event.verseNumber,
            verseDelay,
          });
        }),
        repeatSameAyah: pure((context, event: any) => {
          const verseDelay = event.verseDuration * context.delayMultiplier;
          return sendParent({
            type: 'REPEAT_SAME_AYAH',
            timestampFrom: event.timestampFrom,
            verseDuration: event.verseDuration,
            verseDelay,
          });
        }),
        forwardAdvanceToBoundary: sendParent((_context, event) => event),
        forwardRecalibrateBoundary: pure((context, event: any) =>
          send(
            { type: 'RECALIBRATE_BOUNDARY', timestamp: event.timestamp },
            { to: context.rangeCycleActor.id },
          ),
        ),
        forwardToRangeCycleActor: forwardTo((context) => {
          return context.rangeCycleActor;
        }),
        updateVerseTimings: pure((context, event: any) => [
          assign({
            verseTimings: event.verseTimings,
          }),
          send(
            { type: 'UPDATE_VERSE_TIMINGS', verseTimings: event.verseTimings },
            { to: context.rangeCycleActor.id },
          ),
        ]),
        spawnRangeCycleActor: assign({
          rangeCycleActor: (context) => {
            return spawn(
              createRangeCycleMachine({
                totalRangeCycle: context.repeatSettings.totalRangeCycle,
                totalVerseCycle: context.repeatSettings.totalVerseCycle,
                verseTimings: context.verseTimings,
                fromVerseNumber: context.fromVerseNumber,
                toVerseNumber: context.toVerseNumber,
                repeatMode: context.repeatMode,
                reciterConfig: context.reciterConfig,
              }),
            );
          },
        }),
      },
    },
  );
