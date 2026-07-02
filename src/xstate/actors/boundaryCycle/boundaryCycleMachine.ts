/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react-func/max-lines-per-function */
/* eslint-disable import/prefer-default-export */
// src/xstate/actors/boundaryCycle/boundaryCycleMachine.ts

import { assign, createMachine } from 'xstate';
import { pure, sendParent } from 'xstate/lib/actions';

import { BoundaryPoint, computeTolerance, isTooEarlyInBoundary } from './computeTolerance';

// ─── Context ─────────────────────────────────────────────────────────────────

export type BoundaryCycleContext = {
  boundaries: BoundaryPoint[];
  currentBoundaryIndex: number;
  currentRepeatCycle: number;
  totalRepeatCycle: number;
};

// ─── Events ──────────────────────────────────────────────────────────────────

export type BoundaryCycleEvent =
  | { type: 'TIMESTAMP_UPDATED'; timestamp: number }
  | { type: 'UPDATE_VERSE_TIMING'; boundaries: BoundaryPoint[] }
  | { type: 'RECALIBRATE_BOUNDARY'; timestamp: number };

// ─── Factory ─────────────────────────────────────────────────────────────────

export type CreateBoundaryCycleMachineParams = {
  boundaries: BoundaryPoint[];
  totalRepeatCycle: number;
};

export const createBoundaryCycleMachine = ({
  boundaries,
  totalRepeatCycle,
}: CreateBoundaryCycleMachineParams) =>
  /** @xstate-layout N4IgpgJg5mDOIC5QDcwCdZgMIE8DGANmAIJ4AuA9mgHQCWAdgApoVRpywDEAqowCLEAKgFEA+oICSAWQkA5AOKJQABwqxaZWhXpKQAD0QBaAEwB2AJzULxgCznjAZgAMTgBxOLAGhA5EAVktzIKDXP2MARlsbJ3CAX1jvVAxsfCJSShokzGF6CEhOXVV1TW1dAwRwu2oANjdq8PqG41dmh29fBAdTcOpzU1C3G1dw8OdHeISQego8+CQQLJTCEnIqOiYWNg5CtQ0tHXnyw2qHG2obRwdRroHzNp9-B2o-Fxs32vDTCxtq+MT0TC4ZbpNaLHJ5CA7Yr7MqIYxuaiuIYudzhO7mEbtRDhJx+c6uaqmALdGxo0nmP4LAFLNKrGgAMwYtFgAAtIFC9qVDtiHK5eqY7Gi3F9og4-FiEPY+aYImZqh9zNU-KZKYsgbSMhySgdQEclXyLg4rkb+i87hLDGj8S8PFdXATusZfhMgA */
  createMachine(
    {
      id: 'boundaryCycleActor',
      initial: 'inProgress',
      context: {
        boundaries,
        currentBoundaryIndex: 0,
        currentRepeatCycle: 1,
        totalRepeatCycle,
      },
      states: {
        inProgress: {
          on: {
            // Core timing loop — mirrors verseCycleMachine's TIMESTAMP_UPDATED handler
            TIMESTAMP_UPDATED: {
              cond: 'boundaryEnded',
              target: 'boundaryEnded',
            },

            // Replaces verseCycleMachine's UPDATE_VERSE_TIMING.
            // Called when rangeCycleMachine advances to a new verse.
            // Resets the full boundary list and all counters.
            UPDATE_VERSE_TIMING: {
              actions: 'applyNewBoundaries',
            },

            // Sent by audioPlayerMachine when the user seeks.
            // Finds which boundary contains the new timestamp and resets
            // currentBoundaryIndex and currentRepeatCycle accordingly.
            RECALIBRATE_BOUNDARY: {
              actions: 'recalibrateToBoundary',
            },
          },
        },

        boundaryEnded: {
          always: [
            // Still have repeats left for this boundary → go back and repeat it
            {
              cond: 'repeatOnProgress',
              actions: 'incrementRepeatAndSignalParent',
              target: 'inProgress',
            },
            // Repeats done; there are more boundaries in this verse → advance
            {
              cond: 'hasNextBoundary',
              actions: 'advanceToNextBoundary',
              target: 'inProgress',
            },
            // All boundaries exhausted → verse cycle is done
            {
              target: 'finished',
            },
          ],
        },

        finished: {
          entry: 'signalVerseRepeatFinished',
          description: 'Send VERSE_REPEAT_FINISHED event',
          type: 'final',
        },
      },
    },
    {
      guards: {
        boundaryEnded: (context, event: any) => {
          if (event.type && event.type !== 'TIMESTAMP_UPDATED') return false;

          const boundary = context.boundaries[context.currentBoundaryIndex];
          if (!boundary) return false;

          // Reject timestamps that arrive too early in the boundary window.
          // This prevents false triggers from stale timestamps after a seek.
          if (isTooEarlyInBoundary(event.timestamp, boundary)) return false;

          const tolerance = computeTolerance(boundary);
          return event.timestamp >= boundary.timestampTo - tolerance;
        },

        repeatOnProgress: (context) => {
          return context.currentRepeatCycle < context.totalRepeatCycle;
        },

        hasNextBoundary: (context) => {
          return context.currentBoundaryIndex < context.boundaries.length - 1;
        },
      },

      actions: {
        /**
         * Called when a boundary repeat is still in progress.
         *
         * Mirrors verseCycleMachine's `repeatSameAyah` action — sends
         * REPEAT_SAME_AYAH with the current boundary's timestampFrom
         * and duration for the parent repeat pipeline.
         */
        incrementRepeatAndSignalParent: pure((context) => {
          const boundary = context.boundaries[context.currentBoundaryIndex];
          return [
            assign({
              currentRepeatCycle: context.currentRepeatCycle + 1,
            }),
            sendParent({
              type: 'REPEAT_SAME_AYAH',
              timestampFrom: boundary.timestampFrom,
              verseDelay: boundary.timestampTo - boundary.timestampFrom,
            }),
          ];
        }),

        /**
         * Called when moving to the next waqaf chunk within the same verse.
         *
         * Sends ADVANCE_TO_BOUNDARY — a new event for UI boundary-tracking.
         * Does NOT send REPEAT_SAME_AYAH — this is a forward advance, not a repeat.
         */
        advanceToNextBoundary: pure((context) => {
          const nextIndex = context.currentBoundaryIndex + 1;
          const nextBoundary = context.boundaries[nextIndex];
          return [
            assign({
              currentBoundaryIndex: nextIndex,
              currentRepeatCycle: 1,
            }),
            sendParent({
              type: 'ADVANCE_TO_BOUNDARY',
              boundaryId: nextBoundary.id,
              timestampFrom: nextBoundary.timestampFrom,
              timestampTo: nextBoundary.timestampTo,
            }),
          ];
        }),

        /**
         * Replaces verseCycleMachine's updateVerseTiming.
         * Called when rangeCycleMachine moves to a new verse.
         * Resets all counters so the new verse starts from boundary 0.
         */
        applyNewBoundaries: pure((_, event: any) => {
          return assign({
            boundaries: event.boundaries,
            currentBoundaryIndex: 0,
            currentRepeatCycle: 1,
          });
        }),

        /**
         * Seek recalibration. Finds which boundary the new playhead
         * timestamp falls within and resets the machine to watch it.
         */
        recalibrateToBoundary: pure((context, event: any) => {
          const { timestamp } = event;
          const { boundaries } = context;

          const idx = boundaries.findIndex(
            (b) => timestamp >= b.timestampFrom && timestamp < b.timestampTo,
          );

          let targetIndex: number;

          if (idx !== -1) {
            targetIndex = idx;
          } else if (timestamp < boundaries[0].timestampFrom) {
            targetIndex = 0;
          } else {
            // Past all boundaries — watch the final boundary; completion
            // is handled on the next TIMESTAMP_UPDATED via tolerance.
            targetIndex = boundaries.length - 1;
          }

          return assign({
            currentBoundaryIndex: targetIndex,
            currentRepeatCycle: 1,
          });
        }),

        /**
         * Terminal action. Identical event to verseCycleMachine so
         * rangeCycleMachine's VERSE_REPEAT_FINISHED handler is unchanged.
         */
        signalVerseRepeatFinished: sendParent(() => ({
          type: 'VERSE_REPEAT_FINISHED',
        })),
      },
    },
  );
