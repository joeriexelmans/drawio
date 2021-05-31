"use strict";

export class HistoryItem {
  constructor(value, parent) {
    this.value = value; // e.g. mxGeometryChange, mxChildChange
    this.parent = parent; // array of HistoryEntry, order has no meaning
  }
}

export class HistoryDAG {
  constructor(isConflictCallback) {
    this.heads = []; // order has no meaning
    // all items in heads are always pairwise concurrent, but non-conflicting

    this.isConflictCallback = isConflictCallback;
  }

  append(new_item) {
    for (const parent of new_item.parent) {
      const i = this.heads.indexOf(parent);
      if (i >= 0) {
        // remove parent from heads
        this.heads.splice(i, 1);
      }
    }
    // Check conflict with existing items
    for (const head of this.heads) {
      for (const item of findConcurrentItems(head, new_item)) {
        console.log(`concurrency between ${item.value} and ${new_item.value}`)
        if (this.isConflictCallback(item, new_item)) {
          console.log("conflict!");
        }
      }
    }
    this.heads.push(item);
  }
}



export function isAncestor(parent, child) {
  if (parent === child) {
    return true;
  }
  for (const p of child.parent) {
    if (isAncestor(parent, p)) {
      return true;
    }
  }
  return false;
}

export function* findLCAs(itemA, itemB) {
  // Can probably be optimized, but I don't expect performance issues.
  // Even on high-latency connections, the LCA of concurrent operations will be quickly found.
  if (isAncestor(itemA, itemB)) {
    yield itemA;
    return;
  }

  for (const parent of itemA.parent) {
    yield* findLCAs(parent, itemB);
  }
}

export function* findConcurrentItems(existing_head, new_item) {
  if (isAncestor(existing_head, new_item)) {
    return; // encountered an LCA -> stop
  }
  // Depth-first, inner-first (from old to recent) yield
  for (const parent of existing_head.parent) {
    yield* findConcurrentItems(parent, new_item);
  }
  yield existing_head;
}
