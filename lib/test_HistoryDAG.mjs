"use strict";

import { HistoryItem, HistoryDAG, isAncestor, findLCAs, findConcurrentItems } from "./HistoryDAG.mjs";

(() => {
  const assert = (expr, msg) => {
    class AssertionError extends Error {
      constructor(msg) {
        super(msg);
      }
    }
    if (!expr) {
      throw new AssertionError(msg);
    } else {
      console.log(".")
    }
  };

  (() => {
    const a = new HistoryItem('a', []);
    const b = new HistoryItem('b', [a]);
    const c = new HistoryItem('c', [a]);

    // 1 LCA
    const lcas = [... findLCAs(b, c)];
    assert(lcas.length === 1 && lcas[0] === a, "expected LCAs == [a]");
  })();


  (() => {
    const a = new HistoryItem('a', []);
    const b = new HistoryItem('b', []);
    const c = new HistoryItem('c', [a,b]);
    const d = new HistoryItem('d', [a,b]);

    (() => {
      const lcas = [... findLCAs(c, d)];
      assert(lcas.length === 2 && lcas[0] === a && lcas[1] === b, "expected LCAs == [a,b]");
    })();

    (() => {
      const lcas = [... findLCAs(b, d)];
      assert(lcas.length === 1 && lcas[0] === b, "expected LCAs == [b]");
    })();

    (() => {
      const lcas = [... findLCAs(a, b)];
      assert(lcas.length === 0, "expected LCAs == []");
    })();


    (() => {
      const lcas = [... findLCAs(a, a)];
      assert(lcas.length === 1 && lcas[0] === a, "expected LCAs == [a]");
    })();


    (() => {
      const concurrent = [... findConcurrentItems(c, d)];
      assert(concurrent.length === 1 && concurrent[0] === c, "expected concurrent == [c]")
    })();

  })();

})();