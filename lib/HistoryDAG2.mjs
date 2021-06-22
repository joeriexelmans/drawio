"use strict";

import crypto from 'crypto';

// Taken from:
//  https://stackoverflow.com/a/2117523
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.webcrypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export class History {
  constructor(setState, resolve) {
    // callbacks
    this.setState = setState;
    this.resolve = resolve;

    this.heads = new Map(); // HEAD ptrs; mapping from key to Operation
    this.dummyOp = new Initial(); // The parent of all parentless Operations
    this.last = this.dummyOp; // most recent operation in local (linear) history

    this.ops = new Map(); // contains all operations; mapping from operation id to Operation
    this.ops.set(this.dummyOp.id, this.dummyOp);

    this.recvBuffer = [];
  }

  _getHead(key) {
    const op = this.heads.get(key);
    if (op !== undefined) {
      return op;
    }
    return this.dummyOp;
  }

  _redo(op) {
    // update mapping to point to op
    for (const [key, val] of Object.entries(op.value)) {
      this.heads.set(key, op); // update HEAD ptr
      this.setState(key, val);
    }
  }

  _addOp(newOp, parent, key) {
  }

  // Called when a new user operation happened locally.
  // The new operation advances HEADs.
  newOperation(value) {
    const links = {};
    const newOp = new Operation(uuidv4(), value, links, this.last);
    for (const [key,val] of Object.entries(value)) {
      const parent = this._getHead(key);
      links[key] = {parent, child: null};
      parent.setChild(key, newOp);
    }

    this._redo(newOp);

    this.ops.set(newOp.id, newOp);

    this.last = newOp;

    // console.log("newOperation:", newOp);

    return newOp;
  }

  // Called when an operation carried out by a remote user is received from the network.
  // If the received operation logically follows HEADs, then HEADs are forwarded to include it.
  receiveOperation({id, value, parentIds, prevId}) {
    const postpone = () => {
      // console.log("buffering...")
      this.recvBuffer.push({id, value, parentIds, prevId});
    }
    const prev = this.ops.get(prevId);
    if (prev === undefined) {
      return postpone();
    }
    let exec = true;
    const links = {};
    const newOp = new Operation(id, value, links, prev);
    for (const [key, parentId] of Object.entries(parentIds)) {
      const parent = this.ops.get(parentId);
      if (parent === undefined) {
        // Cannot process operation now - parent missing
        return postpone();
      }
      links[key] = {parent, child: null};

      // Check if there's a concurrent sibling with whom there is a conflict
      const sibling = parent.getChild(key);
      if (sibling !== null) {
        // Conflict
        if (this.resolve(newOp.value, sibling.value)) {
          // console.log("newOp wins")
          const visited = new Set();
          const rollback = op => {
            visited.add(op); // Children form a DAG, with possible 'diamond' shapes -> prevent same operation from being visited more than once.
            for (const [key, {child, parent}] of Object.entries(op.links)) {
              // recurse, child-first
              if (child !== null && !visited.has(child)) {
                rollback(child);
              }
              // rollback
              this.heads.set(key, parent);
              this.setState(key, parent.getValue(key));
            }
          };
          // DFS visit
          rollback(sibling);

        } else {
          // console.log("newOp loses")
          exec = false;
          continue;
        }
      }
      // won (or no conflict):
      parent.setChild(key, newOp);
      if (parent !== this._getHead(key)) {
        // only execute received operation if it advances HEAD
        exec = false;
      }
    }

    if (exec) {
      this._redo(newOp);
    }

    this.ops.set(newOp.id, newOp);

    // console.log("receiveOperation:", newOp);

    // Retry buffered operations
    const oldBuffer = this.recvBuffer;
    this.recvBuffer = [];
    for (const op of oldBuffer) {
      this.receiveOperation(op);
    }
  }

  undoLast() {
    if (this.last === this.dummyOp) {
      return; // cannot undo initial (empty) operation
    }
    for (const [key, {parent}] of Object.entries(this.last.links)) {
      this.heads.set(key, parent);
      this.setState(key, parent.getValue(key));
    }
  }
}


class Operation {
  constructor(id, value, links, prev) {
    this.id = id;
    this.value = value;
    this.links = links;
    this.prev = prev;
    this.next = null;
    this.prev.next = this;
  }
  getValue(key) {
    return this.value[key];
  }
  setChild(key, childOp) {
    this.links[key].child = childOp;
  }
  getChild(key) {
    return this.links[key].child;
  }
  // Basically omit forward references and replaces references by IDs.
  // Result can be JSON'd.
  serialize(op) {
    const parentIds = {};
    for (const [key, {parent}] of Object.entries(this.links)) {
      parentIds[key] = parent.id;
    }

    const result = {
      id: this.id,
      value: this.value,
      parentIds,
      prevId: this.prev.id,
    }
    return result;
  }
}

// Same interface as Operation - special case
class Initial {
  constructor() {
    this.id = "0";
    this.links = {};
  }
  getValue(key) {
    // undefined
  }
  setChild(key, childOp) {
    const link = this.links[key];
    if (link === undefined) {
      this.links[key] = {parent: null, child: childOp};
    } else {
      link.child = childOp;
    }
  }
  getChild(key) {
    const link = this.links[key];
    if (link === undefined) return null;
    return link.child;
  }
}
