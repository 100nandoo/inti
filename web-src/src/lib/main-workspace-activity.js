export function createActivityEntry(id, kind, label, meta) {
  return {
    id,
    kind,
    label,
    meta,
    hidden: false,
  };
}

export function updateActivityEntry(entry, kind, label, meta) {
  return {
    ...entry,
    kind,
    label,
    meta,
  };
}

export function computeActivityHiddenStates({ itemHeights, visibleBudget, isDesktop }) {
  const hiddenStates = itemHeights.map(() => false);
  if (!isDesktop || visibleBudget <= 0) {
    return hiddenStates;
  }

  let consumedHeight = 0;
  let hasVisibleItem = false;

  for (let index = 0; index < itemHeights.length; index += 1) {
    const nextHeight = itemHeights[index];
    if (!hasVisibleItem || consumedHeight + nextHeight <= visibleBudget) {
      consumedHeight += nextHeight;
      hasVisibleItem = true;
      continue;
    }

    hiddenStates[index] = true;
  }

  return hiddenStates;
}
