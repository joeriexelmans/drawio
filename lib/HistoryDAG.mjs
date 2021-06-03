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

    this.conflict = null; // The items in favor of which this item was discarded. This item was in conflict with these items, but the other items "won" the conflict.

    this.executed = false;
  }

  redo(callback) {
    // if (this.executed) {
    //   throw new Error("Precondition failed: Already redone");
    // }
    if (!this.executed) {
      // idempotent
      callback(this);
      this.executed = true;
    }
  }

  undo(callback) {
    // if (!this.executed) {
    //   throw new Error("Precondition failed: Already undone");
    // }
    if (this.executed) {
      // idempotent
      callback(this);
      this.executed = false;
    }
  }

  // canExecute() {
  //   return this.conflicts.length > 0;
  // }

  // // Get HistoryItems that must execute before this HistoryItem.
  // *iterPredecessors() {
  //   // Generator concatenating parents and conflicts.
  //   yield* this.parents;
  //   yield* this.conflicts;
  // }

  // // Iterate over this item and its descendants, child-first.
  // // The same items may be yielded more than once.
  // getRollbackSequence(heads) {
  //   const result = [];
  //   toRollback = new Set();
  //   const visit = item => {
  //     for (const child of item.children) {
  //       visit(child);
  //     }
  //     toRollback.add(this);
  //   }

  //   rolledBack = new Set(heads);

  //   while (toRollback.size > 0) {
  //     for (const item of toRollback) {
  //       let canRollback = true;
  //       for (const child of item.children) {
  //         if (!rolledBack.has(child)) {
  //           canRollback = false;
  //           break;
  //         }
  //       }
  //       if (canRollback) {
  //         result.push(item);
  //         toRollback.remove(item);
  //         rolledBack.add(item);
  //         break;
  //       }
  //     }        
  //   }
  //   return result;
  // }
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

    // Find a potential conflicting item.
    // Even if there are multiple HEADs, newItem can only be in conflict with 1 other existing item:
    // Conflicts are transitive, so if newItem was in conflict with 2 existing items,
    // a conflict between those 2 items would have already been resolved.
    const conflictingItem = (() => {
      for (const head of this.heads) {
        for (const concurrentItem of findConcurrentItems2(head, newItem)) {
          if (this.isConflict(concurrentItem, newItem)) {
            let conflictingItem = concurrentItem;
            while (conflictingItem.conflict !== null) {
              // keep following conflict links until encountering the item we are actually in conflict with
              conflictingItem = conflictingItem.conflict
            }
            return conflictingItem;
          }
        }
      }
    })();

    if (conflictingItem === undefined) {
      newItem.redo(this.redo);
    } else {
      const winner = this.resolve(conflictingItem, newItem);
      const loser = newItem === winner ? conflictingItem : newItem;
      loser.conflict = winner;
      if (winner === newItem) {
        // rollback all descendants of conflictingItem, most recent first
        // const rollbackSequence = conflictingItem.getRollbackSequence();
        // console.log('rolling back...');
        // for (const item of rollbackSequence) {
        //   item.undo(this.undo);
        // }
        // console.log('execute newItem');
        // newItem.redo(this.redo);
        // console.log('fast forward...');
        // for (const item of rollbackSequence.reverse()) {
        //   if (item === conflictingItem)
        //     continue;
        //   item.redo(this.redo);
        // }

        conflictingItem.undo(this.undo);
        newItem.redo(this.redo);
      } else {
        // nothing to be done
      }
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

export function* findLCAs(itemA, itemB) {
  if (isAncestor2(itemA, itemB)) {
    yield itemA; // found! look no further
  } else {
    for (const parent of itemA.parents) {
      yield* findLCAs(parent, itemB);
    }
  }
}

// Recursively find ancestors of existingItem that are concurrent with newItem, yielding the deepest (oldest) ancestors first.
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

// Recursively find ancestors of existingItem that are concurrent with newItem, in order: recent => old.
export function* findConcurrentItems2(existingItem, newItem) {
  if (isAncestor2(existingItem, newItem)) {
    return; // encountered an LCA -> stop recursion
  }
  yield existingItem;
  for (const parent of existingItem.parents) {
    yield* findConcurrentItems2(parent, newItem);
  }
}

