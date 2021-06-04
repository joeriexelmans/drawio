"use strict";

export class HistoryItem {
  constructor(value, parents) {
    this.value = value; // e.g. mxGeometryChange, mxChildChange
    this.parents = parents; // array of HistoryItem, order has no meaning

    // DAG, but doubly-linked:
    this.children = [];
    for (const parent of parents) {
      parent.children.push(this);
    }
  }
}

export class HistoryDAG {
  constructor(redo, undo, isConflict, resolve, check_preconditions = false) {
    this.heads = []; // Array but order has no meaning. If heads consists of multiple items, then those items are concurrent.

    if (check_preconditions) {
      // Perform internal assertions at the cost of performance. Can be disabled in production.
      this.done = new Set();
      this.redo = item => {
        redo(item);
        if (this.done.has(item)) {
          throw new Error("Precondition failed: Already redone");
        }
        this.done.add(item);
      };
      this.undo = item => {
        undo(item);
        if (!this.done.has(item)) {
          throw new Error("Precondition failed: Already undone");
        }
        this.done.delete(item);
      };
    } else {
      this.redo = redo;
      this.undo = undo;
    }
    this.isConflict = isConflict;
    this.resolve = resolve;

    this.lost = new Set(); // Items that lost a conflict in favor of some other item
  }

  add(newItem) {
    for (const parent of newItem.parents) {
      const i = this.heads.indexOf(parent);
      if (i >= 0) {
        // remove parent from heads, newItem will replace it
        this.heads.splice(i, 1);
      }
    }

    const conflictingItems = [];
    for (const concurrentItem of iterTopoAncestors(this.heads, item => !isAncestor2(item, newItem))) {
      // console.log(newItem.value.tag, "is concurrent with", concurrentItem.value.tag)
      if (this.isConflict(concurrentItem, newItem)) {
        if (!this.lost.has(concurrentItem)) {
          conflictingItems.push(concurrentItem);
        }
      }
    }

    if (conflictingItems.length > 0) {
      // Only the last item in the array is the 'original conflict', because it is the deepest item in our child-first topologically ordered visit.
      // All other items are guaranteed to be descendants of the first item.
      const conflictingItem = conflictingItems[conflictingItems.length-1];

      const winner = this.resolve(conflictingItem, newItem);
      const loser = winner === newItem ? conflictingItem : newItem;
      this.lost.add(loser);

      if (winner === newItem) {
        // console.log(newItem.value.tag, "wins against", loser.value.tag);
        // Rollback:
        for (const item of conflictingItems) {
          this.undo(item);
        }
        this.redo(newItem);
      } else {
        // console.log(newItem.value.tag, "loses against", winner.value.tag);
        // nothing to be done
      }
    } else {
      // no conflict
      this.redo(newItem);
    }

    this.heads.push(newItem);
  }
}



export function isAncestor(parent, child) {
  // Seeks from child to parent.
  // Poor performance if child has many ancestors.
  if (parent === child) {
    return true;
  }
  for (const p of child.parents) {
    if (isAncestor(parent, p)) {
      return true;
    }
  }
  return false;
}

export function isAncestor2(parent, child) {
  // Alternative implementation of isAncestor, seeking from parent to child.
  // Better performance when the parent does not have many descendants (typical in synchronous editing).

  if (parent === child) {
    return true;
  }
  for (const c of parent.children) {
    if (isAncestor2(c, child)) {
      return true;
    }
  }
  return false;
}


// Generator yielding ancestors of startItems in topological order, child-first.
export function* iterTopoAncestors(startItems, filter) {
  const visited = new Set();

  function* recurse(item) {
    yield item;

    visited.add(item);

    const nextRoundItems = item.parents.filter(parent => {
      // only visit each item once:
      if (visited.has(parent)) return false;
      for (const child of parent.children) {
        // must have visited all children before:
        if (!visited.has(child)) return false;
      }
      return filter(parent);
    });

    for (const item of nextRoundItems) {
      yield* recurse(item);
    }
  }

  for (const item of startItems) {
    yield* recurse(item);
  }
}
