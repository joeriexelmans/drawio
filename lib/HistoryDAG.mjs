"use strict";

// HistoryItems only record the operation that was carried out (by someone, somewhere), and its parents and children in the DAG.
// They do not contain any other information (is the operation included in 'our' state, or was it undone/rolled back/in conflict with another operation). This allows the same HistoryItem to be added to multiple HistoryDAGs: An operation may be 'visible' in one HistoryDAG, but not in another (e.g. to simulate that it has not yet been received through the network). The main practical benefit of this is testing.
export class HistoryItem {
  constructor(value, parents) {
    this.value = value; // details on the operation that was carried out. 
    this.parents = parents; // array of HistoryItem, order has no meaning

    // DAG, but doubly-linked:
    this.children = [];
    for (const parent of parents) {
      parent.children.push(this);
    }
  }
}

export class HistoryDAG {
  // Properties of callbacks:
  //  - undo/redo:
  //      undo(A) will only be called if redo(A) was the most recent of undo/redo to be called on A.
  //      redo(A) will only be called if undo(A) was the most recent of undo/redo to be called on A, or if no call undo(A) or redo(A) was made yet.
  //      If we are in state S, and redo(A) brings us to state S', then subsequent undo(A) brings us to state S.
  //      If we are in state S, and undo(B) brings us to state S', then subsequent redo(B) brings us to state S.
  //  - isConflict defines a binary relation with the following properties:
  //       symmetric:  isConflict(A,B) => isConflict(B,A)
  //       transitive: isConflict(A,B) && isConflict(B,C) => isConflict(A,C)
  //      2 operations are in conflict when the order in which the operations are executed ('redone') may lead to a different state.
  //      isConflict will never be called with the same operation, hence isConflict(A,A) is allowed to return any result.
  //  - resolve defines a total ordering on conflicting operations and always returns the 'greatest' (or smallest) element of 2:
  //       resolve(A,B) == B && resolve(B,C) == C => resolve(A,C) == C
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
    this.won = new Map();
  }

  // Appends newItem to the History DAG, and advances HEADs to include the new item.
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
      // console.log("conflictingItems:", conflictingItems.map(item=>item.value.tag))

      // Only the last item in the array is the 'original conflict', because it is the deepest item in our child-first topologically ordered visit.
      // All other items are guaranteed to be descendants of the first item.
      const conflictingItem = conflictingItems[conflictingItems.length-1];

      const wonFrom = this.won.get(conflictingItem);
      if (wonFrom && isAncestor2(wonFrom, newItem)) {
        // Special case: concurrentItem has already won from an ancestor of newItem
        // -> as a result, newItem loses from concurrentItem

        // console.log(newItem.value.tag, "loses against", winner.value.tag);
        // nothing to be done
      }
      else {
        const winner = this.resolve(conflictingItem, newItem);
        const loser = winner === newItem ? conflictingItem : newItem;

        if (winner === newItem) {
          // console.log(newItem.value.tag, "wins against", loser.value.tag);
          // Rollback:
          for (const item of conflictingItems) {
            // if (!this.lost.has(item))
              this.undo(item);
          }
          this.redo(newItem);
        } else {
          // console.log(newItem.value.tag, "loses against", winner.value.tag);
          // nothing to be done
        }
        this.lost.add(loser);
        this.won.set(winner, loser);
      }
    } else {
      // no conflict
      this.redo(newItem);
    }

    this.heads.push(newItem);
  }
}


// Is parent ancestor of child?
// Performs DFS search from child to parent, following 'parents' links.
// Can be slow if child has many ancestors.
export function isAncestor(parent, child) {
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

// Is parent ancestor of child?
// Performs DFS search from parent to child, following 'children' links.
// Best performance when the parent does not have many descendants.
export function isAncestor2(parent, child) {
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
