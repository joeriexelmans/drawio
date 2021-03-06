"use strict";

// Should work in browser but only tested with NodeJS

import { HistoryItem, HistoryDAG, isAncestor2, iterTopoAncestors } from "./HistoryDAG.mjs";

{
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
  function setsEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const a of set1) if (!set2.has(a)) return false;
    return true;
  }
  function mapsEqual(map1, map2) {
    if (map1.size !== map2.size) return false;
    for (const [key,value] of map1) {
      if (value !== map2.get(key)) return false;
      return true;
    }
  }




  function runTest(verbose) {

    function info() {
      if (verbose)
        console.log(...arguments);
    }

    const largestWins = (item1, item2) => item1.value.tag > item2.value.tag ? item1 : item2;
    const smallestWins = (item1, item2) => item1.value.tag > item2.value.tag ? item2 : item1;

    function getConcurrentItems(heads, newItem) {
      return new Set(iterTopoAncestors(heads, item => !isAncestor2(item, newItem)));
    }

    function makeDAG(trace, resolveCb) {
      const state = new Map();
      function redo(item) {
        item.prevState = state.get(item.value.target);
        state.set(item.value.target, item.value.tag);
        info('redo', item.value.tag);
        trace.push({event: 'redo', tag: item.value.tag});
      }
      function undo(item) {
        state.set(item.value.target, item.prevState);
        info('undo', item.value.tag);
        trace.push({event: 'undo', tag: item.value.tag});
      }
      function isConflict(item1, item2) {
        return item1.value.target === item2.value.target
      }
      function resolve(item1, item2) {
        const winner = resolveCb(item1, item2);
        info('conflict', item1.value.tag, item2.value.tag, "winner:", winner.value.tag);
        const loser = item1.value.tag <= item2.value.tag ? item1 : item2;
        trace.push({event:'resolve', winner: winner.value.tag, loser: loser.value.tag});
        return winner;
      }
      return [new HistoryDAG(
        redo, undo, isConflict, resolve, // callbacks
        true // check_preconditions
        ), state];
    }

    function exec(insertionOrder, resolveCb) {
      const trace = [];
      const [dag, state] = makeDAG(trace, resolveCb);
      insertionOrder.forEach(item => {
        info("adding ", item.value.tag)
        dag.add(item);
      });
      return [dag, state, trace];
    }


    {
      const a = new HistoryItem({tag: 'a', target:1}, []);
      const b = new HistoryItem({tag: 'b', target:2}, []);
      const c = new HistoryItem({tag: 'c', target:1}, [a,b]);
      const d = new HistoryItem({tag: 'd', target:1}, [a,b]);
      const e = new HistoryItem({tag: 'e', target:1}, []);

      {
        // items concurrent with 'd':
        const concurrentItems = getConcurrentItems([c], d);
        assert(setsEqual(concurrentItems, new Set([c])));
      }

      {
        // items concurrent with 'e':
        const concurrentItems = getConcurrentItems([c,d], e);
        assert(setsEqual(concurrentItems, new Set([a,b,c,d])));
      }


      {
        info("Test case: abcde.....")

        const [dag, state, trace] = exec([a,b,c,d,e], largestWins);

        const expectedTrace = [
          // inserting a:
          {event: 'redo', tag: 'a'},
          // inserting b:
          {event: 'redo', tag: 'b'},
          // inserting c:
          {event: 'redo', tag: 'c'},
          // inserting d:
          {event: 'resolve', winner: 'd', loser: 'c'},
          {event: 'undo', tag: 'c'},
          {event: 'redo', tag: 'd'},
          // inserting e:
          {event: 'resolve', winner: 'e', loser: 'a'},
          {event: 'undo', tag: 'd'},
          {event: 'undo', tag: 'a'},
          {event: 'redo', tag: 'e'},
        ];

        info("expectedTrace trace:", expectedTrace);
        info("actual trace:", trace);

        // slow but simple deep compare:
        assert(deepEqual(trace, expectedTrace), "unexpected trace");
      }
    }

    function runTest(insertionOrders, resolveCb) {
      let first = true;
      let firstDAG, firstState;
      for (const order of insertionOrders) {
        info("trying insertion order:", order.map(item=>item.value.tag));
        const [dag, state] = exec(order, resolveCb);
        info("state:", state);
        info("dag.done:", [...dag.done].map(item=>item.value.tag));
        if (first) {
          firstDAG = dag;
          firstState = state;
          first = false;
        } else {
          assert(setsEqual(firstDAG.done, dag.done) && mapsEqual(firstState, state), "Insertion order should not affect eventual state.");
        }
      }
    }

    {
      const a = new HistoryItem({tag: 'a', target:1}, []);
      const b = new HistoryItem({tag: 'b', target:2}, []);
      const c = new HistoryItem({tag: 'c', target:1}, [a,b]);
      const d = new HistoryItem({tag: 'd', target:2}, [a,b]);
      const e = new HistoryItem({tag: 'e', target:2}, [c]); // conflict with d
      const f = new HistoryItem({tag: 'f', target:1}, [c]);
      const g = new HistoryItem({tag: 'g', target:1}, [e,f]);
      const h = new HistoryItem({tag: 'h', target:3}, [e,f]);
      const i = new HistoryItem({tag: 'i', target:2}, [g]); // conflict with d

      {
        const concurrentItems = getConcurrentItems([h,i], d);
        assert(setsEqual(concurrentItems, new Set([i, g, h, e, f, c])));
      }

      {
        const concurrentItems = getConcurrentItems([h,d], i);
        // info("concurrentItems:", concurrentItems);
        assert(setsEqual(concurrentItems, new Set([d, h])));
      }

      const insertionOrders = [
        // largestWins: e wins from d.
        // smallestWins: d wins from e. next, d wins from i
        [a,b,c,e,f,g,h,d,i],

        // largestWins: i wins from d.
        // smallestWins: d wins from i.
        [a,b,c,e,f,g,h,i,d],

        // no idea about these, but they are legal insertion orders so they should give the same results:
        [b,a,d,c,e,f,h,g,i],
        [a,b,d,c,e,f,h,g,i],
        [a,b,d,c,e,f,g,i,h],
        [b,a,d,c,e,f,g,i,h],
      ]


      info("Test case: largestWins...")
      runTest(insertionOrders, largestWins);
      info("Test case: smallestWins...")
      runTest(insertionOrders, smallestWins);
    }

    {
      const a = new HistoryItem({tag: 'a', target:1}, []);
      const b = new HistoryItem({tag: 'b', target:2}, []);
      const c = new HistoryItem({tag: 'c', target:1}, [a,b]);
      const d = new HistoryItem({tag: 'd', target:2}, [a,b]);
      const e = new HistoryItem({tag: 'e', target:2}, [c]); // conflict with d
      const f = new HistoryItem({tag: 'f', target:1}, [c]);
      const g = new HistoryItem({tag: 'g', target:1}, [e,f]);
      const h = new HistoryItem({tag: 'h', target:3}, [e,f]);
      const zero = new HistoryItem({tag: '0', target:2}, [g]); // conflict with d

      const insertionOrders = [
        // largestWins: e wins from d.
        // smallestWins: d wins from e. next, d wins from i
        [a,b,c,e,f,g,h,d,zero],

        // largestWins: i wins from d.
        // smallestWins: d wins from i.
        [a,b,c,e,f,g,h,zero,d],

        // no idea about these, but they are legal insertion orders so they should give the same results:
        [b,a,d,c,e,f,h,g,zero],
        [a,b,d,c,e,f,h,g,zero],
        [a,b,d,c,e,f,g,zero,h],
        [b,a,d,c,e,f,g,zero,h],
      ]

      info("Test case: largestWins...")
      runTest(insertionOrders, largestWins);
      info("Test case: smallestWins...")
      runTest(insertionOrders, smallestWins);      
    }

  }

  runTest(true); // may throw
  console.log("OK");

}