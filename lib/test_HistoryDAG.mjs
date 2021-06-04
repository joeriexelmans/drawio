"use strict";

// Should work in browser but only tested with NodeJS

import { HistoryItem, HistoryDAG, /*isAncestor,*/ isAncestor2, iterTopoAncestors } from "./HistoryDAG.mjs";

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
        // info('redo', item.value.tag);
        trace.push({event: 'redo', tag: item.value.tag});
      }
      function undo(item) {
        state.set(item.value.target, item.prevState);
        // info('undo', item.value.tag);
        trace.push({event: 'undo', tag: item.value.tag});
      }
      function isConflict(item1, item2) {
        return item1.value.target === item2.value.target
      }
      function resolve(item1, item2) {
        const winner = resolveCb(item1, item2);
        // info('conflict', item1.value.tag, item2.value.tag, "winner:", winner.value.tag);
        const loser = item1.value.tag <= item2.value.tag ? item1 : item2;
        trace.push({event:'resolve', winner: winner.value.tag, loser: loser.value.tag});
        return winner;
      }
      return [new HistoryDAG(redo, undo, isConflict, resolve, true), state];
    }

    function exec(insertionOrder, resolveCb) {
      const trace = [];
      const [dag, state] = makeDAG(trace, resolveCb);
      insertionOrder.forEach(item => {
        // info("adding ", item.value.tag)
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

      const insertionOrder1 = [a,b,c,e,f,g,h,d,i];
      // largestWins: conflict between e and d. e wins. next, i is appended without conflict.
      // smallestWins: conflict between e and d. d wins. next, conflict between i and d, d wins.

      const insertionOrder2 = [a,b,c,e,f,g,h,i,d];
      // largestWins: conflict between i and d, i wins.
      // smallestWins: conflict between i and d, d wins.

      function runTest(resolveCb) {
        const [dag1, state1] = exec(insertionOrder1, resolveCb);
        const [dag2, state2] = exec(insertionOrder2, resolveCb);

        info("state1:", state1);
        info("state2:", state2);

        info("dag1.done:", [...dag1.done].map(item=>item.value.tag));
        info("dag2.done:", [...dag2.done].map(item=>item.value.tag));

        assert(setsEqual(dag1.done, dag2.done) && deepEqual(state1, state2), "Insertion order should not affect eventual state.");
      }

      info("Test case: largestWins...")
      runTest(largestWins);
      info("Test case: smallestWins...")
      runTest(smallestWins);
    }
  }

  runTest(true); // may throw
  console.log("OK");

}