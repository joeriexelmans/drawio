"use strict";

// Should work in browser but only tested with NodeJS v14.16.1

import { serialize, History } from "./HistoryDAG2.mjs";


// From: https://stackoverflow.com/a/43260158
// returns all the permutations of a given array
function perm(xs) {
  let ret = [];

  for (let i = 0; i < xs.length; i = i + 1) {
    let rest = perm(xs.slice(0, i).concat(xs.slice(i + 1)));

    if(!rest.length) {
      ret.push([xs[i]])
    } else {
      for(let j = 0; j < rest.length; j = j + 1) {
        ret.push([xs[i]].concat(rest[j]))
      }
    }
  }
  return ret;
}

// Reinventing the wheel:

function assert(expr, msg) {
  class AssertionError extends Error {
    constructor(msg) {
      super(msg);
    }
  }
  if (!expr) {
    // console.log(...arguments);
    throw new AssertionError(msg);
  }
}

function deepEqual(val1, val2) {
  if (typeof(val1) !== typeof(val2)) return false;

  if ((val1 === null) !== (val2 === null)) return false;

  switch (typeof(val1)) {
    case 'object':
      for (var p in val2) {
        if (val1[p] === undefined) return false;
      }
      for (var p in val1) {
        if (!deepEqual(val1[p], val2[p])) return false;
      }
      return true;
    case 'array':
      if (val1.length !== val2.length) return false;
      for (let i=0; i<val1.length; ++i)
        if (!deepEqual(val1[i], val2[i])) return false;
      return true;
    default:
      return val1 === val2;
  }
}


// Test:


function runTest(verbose) {

  function createMapping() {
    const m = new Map();
    return {
      get: key => m.get(key),
      set: (key, value) => m.set(key, value),
    };
  }

  function info() {
    if (verbose) console.log(...arguments);
  }

  function getProperties(value) {
    // info("getProperties", value)
    return Object.keys(value);
  }

  function resolve(value1, value2) {
    info("resolve...", value1, value2)
    if (value1.geometry !== value2.geometry) {
      return value1.geometry > value2.geometry;
    }
    return value1.style > value2.style;
  }

  function createAppState() {
    const state = {};

    function redo(op) {
      Object.assign(state, op.value);
      info("redo", op.id.slice(0,8), op.value);
      // info("  state =", state);
    }

    function undo(op) {
      for (const [prop, v] of Object.entries(op.props)) {
        if (v.parent.value) {
          state[prop] = v.parent.value[prop];
        }
      }
      info("undo", op.id.slice(0,8));
      // info("state =", state);
    }

    return {redo, undo, state};
  }

  function createHistory() {
    const mapping = createMapping();
    const {redo, undo, state} = createAppState();
    const history = new History(mapping, redo, undo, getProperties, resolve,
      true, // check_assertions
    );
    return {history, state};
  }

  info("Test case: Only local operations (no concurrency). Sending operations over the network in random order. Receiver should reconstruct an identical state.")

  info("insertions...")
  const {history: expectedHistory, state: expectedState} = createHistory();
  const insertions = [
    /* 0: */ expectedHistory.newOperation({geometry: 1, style: 1}),
    /* 1: */ expectedHistory.newOperation({geometry: 2}), // depends on 0
    /* 2: */ expectedHistory.newOperation({style: 2}), // depends on 0
  ];

  const permutations = perm(insertions);
  for (const insertionOrder of permutations) {
    info("permutation...")
    const {history: actualHistory, state: actualState} = createHistory();
    for (const op of insertionOrder) {
      actualHistory.receiveOperation(serialize(op));
    }
    assert(deepEqual(expectedState, actualState));
  }

  info("Test case: Concurrency with conflict")

  const {history: history1, state: state1} = createHistory();
  const {history: history2, state: state2} = createHistory();

  const op1 = history1.newOperation({geometry: 1});
  const op2 = history2.newOperation({geometry: 2});

  history1.receiveOperation(serialize(op2));
  history2.receiveOperation(serialize(op1));

  assert(deepEqual(state1, state2))
}

runTest(/* verbose: */ true);
console.log("OK");
