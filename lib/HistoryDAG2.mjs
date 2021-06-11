"use strict";

// if (typeof window === 'undefined') {
//   // import { webcrypto } from "crypto";
// }

import crypto from 'crypto';


// Taken from:
//  https://stackoverflow.com/a/2117523
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.webcrypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
// class MappingBase {
//   get(key) {}
//   set(key, value) {}
// }

export class History {
  // mapping: {get: function(prop) -> op, set: function(prop, op)}
  // undo: function(op)
  // redo: function(op)
  // getProperties: function(value) -> [str]
  // resolve: function(op, op) -> bool
  constructor(mapping, redo, undo, getProperties, resolve, check_assertions = false) {
    // callbacks
    this.mapping = mapping;
    this.redo = redo;
    this.undo = undo;
    // this.redo = op => redo(op.value);
    // this.undo = op => undo(op.value);
    this.getProperties = getProperties;
    this.resolve = resolve;

    this.dummyOp = {
      id: "0",
      props: {},
    };

    this.ops = new Map();
    this.ops.set(this.dummyOp.id, this.dummyOp);

    this.recvBuffer = [];

    if (check_assertions) {
      this.done = new Set();
      this.done.add(this.dummyOp);
      const common_assert = op => {
        for (const {parent, child} of Object.values(op.props)) {
          if (parent !== undefined && !this.done.has(parent))
            throw new Error("Assertion failed: Undo/redo but parent is undone");
          if (child !== undefined && this.done.has(child))
            throw new Error("Assertion failed: Undo/redo but child is not undone");
        }
      }
      this.redo = op => {
        if (this.done.has(op))
          throw new Error("Assertion failed: Already redone");
        common_assert(op);
        this.done.add(op);
        redo(op);
      };
      this.undo = op => {
        if (!this.done.has(op))
          throw new Error("Assertion failed: Already undone");
        common_assert(op);
        this.done.delete(op);
        undo(op);
      };
    }
  }

  _redo(op) {
    // update mapping to point to op
    for (const prop of Object.keys(op.props)) {
      this.mapping.set(prop, op);
    }
    // actually redo
    this.redo(op);
  }

  _undo(op) {
    // update mapping to point to parent
    for (const [prop, v] of Object.entries(op.props)) {
      this.mapping.set(prop, v.parent);
    }
    // actually undo
    this.undo(op);
  }


  _handleConflict(newOp, parent, prop) {
    const sibling = parent.props[prop].child;
    if (sibling !== null) {
      // Conflict
      if (this.resolve(newOp.value, sibling.value)) {
        console.log("newOp wins")
        // we won - rollback sibling and all of its descendants
        const visited = new Set();
        const rollback = op => {
          visited.add(op); // Children form a DAG, with possible 'diamond' shapes -> prevent same operation from being visited more than once.
          for (const {child} of Object.values(op.props)) {
            if (child !== null) {
              if (!visited.has(child)) {
                rollback(child);
              }              
            }
          }
          this._undo(op);
        };
        // DFS visit
        rollback(sibling);

      } else {
        // we lost the conflict
        console.log("newOp loses")
        return false;
      }
    } else {
      console.log("no conflict")
    }
    parent.props[prop].child = newOp;
    return true;
  }

  // Called when a new user operation happened locally.
  newOperation(value) {
    let redo = true;
    const id = uuidv4();
    const props = {};
    const newOp = { id, value, props };
    for (const prop of this.getProperties(value)) {
      let parent = this.mapping.get(prop);
      if (parent === undefined) {
        parent = this.dummyOp;
        // dummyOp is special - create property
        this.dummyOp.props[prop] = {child: null};
      }
      props[prop] = {parent, child: null};
      const won = this._handleConflict(newOp, parent, prop);
      redo && (redo = won);
    }

    if (redo) {
      this._redo(newOp);
    }

    this.ops.set(id, newOp);

    return newOp;
  }

  // Called when an operation carried out by a remote user is received from the network.
  receiveOperation({id, value, parentIds}) {
    let redo = true;
    const props = {};
    const newOp = { id, value, props, };
    for (const [prop, parentId] of Object.entries(parentIds)) {
      const parent = this.ops.get(parentId);
      if (parent === undefined) {
        // Cannot process operation now - parent missing
        console.log("buffering...")
        this.recvBuffer.push({id, value, parentIds});
        return;
      }
      if (parent === this.dummyOp && !(prop in this.dummyOp.props)) {
        // dummyOp is special - create property
        this.dummyOp.props[prop] = {child: null};
      }

      props[prop] = {parent, child: null};
      const won = this._handleConflict(newOp, parent, prop);
      redo && (redo = won);

      const head = this.mapping.get(prop);
      if (parent !== this.dummyOp && head !== parent) {
        console.log("head is not parent")
        redo = false;
      }
    }


    if (redo) {
      console.log("redoing")
      this._redo(newOp);
    }

    this.ops.set(id, newOp);

    // Retry buffered operations
    const oldBuffer = this.recvBuffer;
    this.recvBuffer = [];
    for (const op of oldBuffer) {
      this.receiveOperation(op);
    }
  }
}

export function serialize(op) {
  const parentIds = {};
  for (const [prop, v] of Object.entries(op.props)) {
    parentIds[prop] = v.parent.id;
  }
  return {
    id: op.id,
    value: op.value,
    parentIds,
  }
}
