"use strict";

// Should work in browser but only tested with NodeJS

import { HistoryItem, HistoryDAG, isAncestor, isAncestor2, /*findLCAs,*/ iterConcurrentItems } from "./HistoryDAG.mjs";

{
  function assert(expr, msg) {
    class AssertionError extends Error {
      constructor(msg) {
        super(msg);
      }
    }
    if (!expr) {
      throw new AssertionError(msg);
    } else {
      // console.log(".")
    }
  }

  function runTest() {

    // {
    //   const a = new HistoryItem('a', []);
    //   const b = new HistoryItem('b', [a]);
    //   const c = new HistoryItem('c', [a]);

    //   assert(isAncestor(a, b));
    //   assert(isAncestor(a, c));
    //   assert(!isAncestor(b, c));
    //   assert(!isAncestor(c, b));

    //   // 1 LCA
    //   const lcas = [... findLCAs(b, c)];
    //   assert(lcas.length === 1 && lcas[0] === a);
    // }


    {
      const a = new HistoryItem({tag: 'a', target:1}, []);
      const b = new HistoryItem({tag: 'b', target:2}, []);
      const c = new HistoryItem({tag: 'c', target:1}, [a,b]);
      const d = new HistoryItem({tag: 'd', target:1}, [a,b]);
      const e = new HistoryItem({tag: 'e', target:1}, []);

      // {
      //   const lcas = [... findLCAs(c, d)];
      //   assert(lcas.length === 2 && lcas[0] === a && lcas[1] === b);
      // }

      // {
      //   const lcas = [... findLCAs(b, d)];
      //   assert(lcas.length === 1 && lcas[0] === b);
      // }

      // {
      //   const lcas = [... findLCAs(a, b)];
      //   assert(lcas.length === 0);
      // }

      // {
      //   const lcas = [... findLCAs(a, a)];
      //   assert(lcas.length === 1 && lcas[0] === a);
      // }


      {
        let i=0;
        for (const item of iterConcurrentItems(c, d)) {
          assert(item === c, "expected d to be concurrent only with c");
          i++;
        }
        assert(i === 1, "expected only one concurrent pair (c,d)");
      }

      {
        const trace = [];
        function redo(item) {
          trace.push({event: 'redo', tag: item.value.tag});
        }
        function undo(item) {
          trace.push({event: 'undo', tag: item.value.tag});
        }
        function isConflict(item1, item2) {
          return item1.value.target === item2.value.target
        }
        function resolve(item1, item2) {
          const winner = item1.value.tag > item2.value.tag ? item1 : item2;
          const loser = item1.value.tag <= item2.value.tag ? item1 : item2;
          trace.push({event:'conflict', winner: winner.value.tag, loser: loser.value.tag});
          return winner;
        }
        const dag = new HistoryDAG(redo, undo, isConflict, resolve);

        dag.add(a);
        dag.add(b);
        dag.add(c);
        dag.add(d); // conflict with c! -> d is chosen
        dag.add(e); // conflict with d! -> e is chosen

        const expectedTrace = [
          // inserting a:
          {event: 'redo', tag: 'a'},
          // inserting b:
          {event: 'redo', tag: 'b'},
          // inserting c:
          {event: 'redo', tag: 'c'},
          // inserting d:
          {event: 'conflict', winner: 'd', loser: 'c'},
          {event: 'undo', tag: 'c'},
          {event: 'redo', tag: 'd'},
          // inserting e:
          {event: 'conflict', winner: 'e', loser: 'd'},
          {event: 'undo', tag: 'd'},
          {event: 'redo', tag: 'e'},
        ];

        // slow but simple deep compare:
        assert(JSON.stringify(trace) === JSON.stringify(expectedTrace), "unexpected trace: " + JSON.stringify(trace, null, 2));
      }
    }
  }

  runTest(); // may throw
  console.log("OK");

}