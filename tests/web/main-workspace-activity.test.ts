import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeActivityHiddenStates,
  createActivityEntry,
  updateActivityEntry,
} from '../../web-src/src/lib/main-workspace-activity.js';

test('activity entries keep retained history separate from their current rendering state', () => {
  const entry = createActivityEntry(7, 'info', 'Working Text', 'summarizing…');
  const updated = updateActivityEntry(entry, 'ok', '"Draft"', '4 words → summary · 0.4s');

  assert.deepEqual(entry, {
    id: 7,
    kind: 'info',
    label: 'Working Text',
    meta: 'summarizing…',
    hidden: false,
  });
  assert.deepEqual(updated, {
    id: 7,
    kind: 'ok',
    label: '"Draft"',
    meta: '4 words → summary · 0.4s',
    hidden: false,
  });
});

test('desktop activity visibility keeps the newest entries visible within the feed budget', () => {
  assert.deepEqual(
    computeActivityHiddenStates({
      itemHeights: [52, 48, 46],
      visibleBudget: 110,
      isDesktop: true,
    }),
    [false, false, true],
  );
});

test('narrow layouts keep the retained activity history fully visible', () => {
  assert.deepEqual(
    computeActivityHiddenStates({
      itemHeights: [52, 48, 46],
      visibleBudget: 110,
      isDesktop: false,
    }),
    [false, false, false],
  );
});
