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

    this.conflicts = []; // The items in favor of which this item was discarded. This item was in conflict with these items, but the other items "won" the conflict.

    this.executed = false;
  }

  redo(callback) {
    // if (this.executed) {
    //   throw new Error("Precondition failed: Already redone");
    // }
    if (!this.executed) {
      // idempotent - makes implementation much simpler
      callback(this);
      this.executed = true;
      return true;
    }
    return false;
  }

  undo(callback) {
    // if (!this.executed) {
    //   throw new Error("Precondition failed: Already undone");
    // }
    if (this.executed) {
      // idempotent - makes implementation much simpler
      callback(this);
      this.executed = false;
      return true;
    }
    return false;
  }

  // canExecute() {
  //   return this.conflicts.length > 0;
  // }

  // Get HistoryItems that must execute before this HistoryItem.
  *iterPredecessors() {
    // Generator concatenating parents and conflicts.
    yield* this.parents;
    yield* this.conflicts;
  }

  // Iterate over this item and its descendants, child-first.
  // The same items may be yielded more than once.
  *iterDescendants() {
    for (const child of this.children) {
      yield* child.iterDescendants();
    }
    yield this;
  }

}

// export class HistoryConflict {
//   constructor(chosen, unchosen) {
//     this.chosen = chosen; // the HistoryItem that was chosen as the 'winning' one
//     this.unchosen = unchosen; // array. the HistoryItem(s) that were discarded in favor of the winning one
//   }
// }

export class HistoryDAG {
  constructor(redo, undo, isConflict, resolve) {
    this.heads = []; // array but order has no meaning
    // if heads consists of multiple items, then those items are concurrent.

    // callbacks
    this.redo = redo;
    this.undo = undo;
    this.isConflict = isConflict;
    this.resolve = resolve;
  }

  add(newItem) {
    for (const parent of newItem.parents) {
      const i = this.heads.indexOf(parent);
      if (i >= 0) {
        // remove parent from heads
        this.heads.splice(i, 1);
      }
    }
    const undone = [];
    // Check conflict with existing items
    for (const head of this.heads) {
      for (const oldItem of findConcurrentItems(head, newItem)) {
        if (this.isConflict(oldItem, newItem)) {
          const chosen = this.resolve(oldItem, newItem);
          const unchosen = (chosen === oldItem) ? newItem : oldItem;
          // console.log("conflict", unchosen.value, "in favor of", chosen.value);

          unchosen.conflicts.push(chosen);

          if (unchosen === oldItem) {
            // rollback all descendants of oldItem that are reachable from 'heads'
            for (const item of unchosen.iterDescendants()) {
              if (this.undo(item) && item !== unchosen) {
                // console.log("rollback", item)
                undone.push(item);
              }
            }
          }
        }
      }
    }
    this.heads.push(newItem);

    if (newItem.conflicts.length === 0) {
      this.redo(newItem);
    }

    // fast-forward again
    for (let i=undone.length; i>0; i--) {
      this.redo(undone[i]);
    }


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

export function* findLCAs(itemA, itemB) {
  if (isAncestor2(itemA, itemB)) {
    yield itemA; // found! look no further
  } else {
    for (const parent of itemA.parents) {
      yield* findLCAs(parent, itemB);
    }
  }
}

// Recursively find an ancestors of existingItem that are concurrent with newItem, yielding the deepest (oldest) ancestors first.
export function* findConcurrentItems(existingItem, newItem) {
  if (isAncestor2(existingItem, newItem)) {
    // return [existingItem]; // encountered an LCA -> stop recursion + bubble up LCA to callee
    return;
  }
  // Depth-first, parent-first visit to achieve old-to-recent yield
  // const lcas = [];
  for (const parent of existingItem.parents) {
    // recursively find items concurrent with 'newItem', while accumulating LCAs.
    const lca = yield* findConcurrentItems(parent, newItem);
    // lcas.push(... lca);
  }
  // yield [lcas, existingItem];
  yield existingItem;
  // return lcas;
}

