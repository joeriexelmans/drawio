"use strict";

// Should work in browser but only tested with NodeJS v14.16.1

import { History } from "./HistoryDAG2.mjs";


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

  function info() {
    if (verbose) console.log(...arguments);
  }

  function resolve(value1, value2) {
    // info("resolve...", props1, props2)
    if (value1.geometry !== value2.geometry) {
      return value1.geometry > value2.geometry;
    }
    return value1.style > value2.style;
  }

  function createAppState(label) {
    const state = {};

    function setState(prop, val) {
      state[prop] = val;
      info("  ", label, "state =", state);
    }
    
    return {setState, state};
  }

  function createHistory(label) {
    const {setState, state} = createAppState(label);
    const history = new History(setState, resolve,
      true, // check_assertions
    );
    return {history, state};
  }

  {
    info("\nTest case: Only local operations (no concurrency). Sending operations over the network in random order. Receiver should reconstruct an identical state.\n")

    info("insertions...")
    const {history: expectedHistory, state: expectedState} = createHistory("expected");
    const insertions = [
      /* 0: */ expectedHistory.newOperation({geometry: 1, style: 1}),
      /* 1: */ expectedHistory.newOperation({geometry: 2}), // depends on 0
      /* 2: */ expectedHistory.newOperation({style: 2}), // depends on 0
    ];

    const permutations = perm(insertions);
    for (const insertionOrder of permutations) {
      info("permutation...")
      const {history: actualHistory, state: actualState} = createHistory("actual");
      for (const op of insertionOrder) {
        actualHistory.receiveOperation(((op.serialize())));
      }
      assert(deepEqual(expectedState, actualState));
    }
  }

  {
    info("\nTest case: Multi-user without conflict\n")

    const {history: history1, state: state1} = createHistory("history1");
    const {history: history2, state: state2} = createHistory("history2");

    const op1 = history1.newOperation({geometry: 1});
    history2.receiveOperation(op1.serialize());
    const op2 = history2.newOperation({geometry: 2}); // overwrites op1
    history1.receiveOperation(op2.serialize());

    assert(deepEqual(state1, state2));
  }

  {
    info("\nTest case: Concurrency with conflict\n")

    const {history: history1, state: state1} = createHistory("history1");
    const {history: history2, state: state2} = createHistory("history2");

    const op1 = history1.newOperation({geometry: 1});
    const op2 = history2.newOperation({geometry: 2});

    history1.receiveOperation(((op2.serialize())));
    history2.receiveOperation(((op1.serialize())));

    assert(deepEqual(state1, state2));
  }

  {
    info("\nTest case: Concurrency with conflict (2)\n")

    const {history: history1, state: state1} = createHistory("history1");
    const {history: history2, state: state2} = createHistory("history2");

    info("history1 insert...")
    const op1 = history1.newOperation({geometry: 1});
    const op2 = history1.newOperation({geometry: 4});

    info("history2 insert...")
    const op3 = history2.newOperation({geometry: 2});
    const op4 = history2.newOperation({geometry: 3});

    info("history1 receive...")
    history1.receiveOperation(op4.serialize()); // buffered
    history1.receiveOperation(op3.serialize()); // op3 wins from op1 -> op2 and op1 undone

    info("history2 receive...")
    history2.receiveOperation(((op1.serialize()))); // op1 loses from op3
    history2.receiveOperation(((op2.serialize()))); // no conflict

    assert(deepEqual(state1, state2));
  }
}

runTest(/* verbose: */ true);
console.log("OK");
