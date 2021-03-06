ScreenShare = (function() {

  function encode(cells) {
    const codec = new mxCodec();
    const encoded = codec.encode(cells);
    return mxUtils.getXml(encoded);
  };


  return class {

    decode(xmlString) {
      const parsedXml = mxUtils.parseXml(xmlString).documentElement;
      const codec = new mxCodec();
      codec.lookup = id => this.graph.model.cells[id];
      return codec.decode(parsedXml);
    }

    constructor(client, peers, graph, undoManager, confirm, alert) {
      this.graph = graph;
      this.undoManager = undoManager;
      this.sharingWith = null;
      this.confirm = confirm;
      this.alert = alert;

      const otherPeerEndScreenshare = peer => {
        if (this.sharingWith === peer) {
          this.alert(`Peer ${shortUUID(peer)} left. You are alone again.`);
          this.sharingWith = null;
        }
      }

      peers.on('leave', otherPeerEndScreenshare);

      const share = (what, data) => {
        if (this.sharingWith) {
          this.p2p.send(this.sharingWith, what, data,
            err => { if (err) console.log("ignoring err:", err) });
        }
      }

      let listenerEnabled = true;

      this.undoManager.addListener(null, (source, eventObj) => {
        if (listenerEnabled) {
          if (eventObj.properties.edit) {
            const {changes, redone, undone, significant} = eventObj.properties.edit;
            share("undoEvent", {
              encodedChanges: changes.map(c => encode(c)),
              redone,
              undone,
              significant,
            });            
          }
        }
      });

      this.graph.selectionModel.addListener(mxEvent.CHANGE, (source, eventObj) => {
        if (listenerEnabled) {
          const {added, removed} = eventObj.properties;
          share("selectionEvent", {
            addedIds: removed ? removed.map(cell => cell.id) : [],
            removedIds: added ? added.map(cell => cell.id) : [],
          });
        }
      });

      // Locking

      const locked = {}; // map cell id => mxCellHighlight

      const lockCell = cell => {
        const highlight = locked[cell.id];
        if (!highlight) {
          const highlight = new mxCellHighlight(this.graph, "#7700ff", 6);
          highlight.highlight(this.graph.view.getState(cell));
          locked[cell.id] = highlight;
        }
      };
      const unlockCell = cell => {
        const highlight = locked[cell.id];
        if (highlight) {
          highlight.destroy();
          delete locked[cell.id]
        }
      }

      // Locking part #1: Intercepting mxGraph.fireMouseEvent
      const oldFireMouseEvent = this.graph.fireMouseEvent;
      this.graph.fireMouseEvent = function(evtName, me, sender) {
        if (me.state && locked[me.state.cell.id]) {
          // clicked shape is locked
          return;
        }
        oldFireMouseEvent.apply(this, arguments);
      }
      // Locking part #2: Ignore double clicks on locked cells
      const oldDblClick = this.graph.dblClick;
      this.graph.dblClick = function(evt, cell) {
        if (cell && locked[cell.id]) {
          // clicked shape is locked
          return;
        }
        oldDblClick.apply(this, arguments);
      }
      // Locking part #3: Protect locked cells from ever being selected
      const oldMxSelectionChange = mxSelectionChange; // override constructor :)
      mxSelectionChange = function(selectionModel, added, removed) {
        oldMxSelectionChange.apply(this, arguments);
        if (this.added) {
          this.added = this.added.filter(cell => !locked[cell.id]);
        }
      }
      mxSelectionChange.prototype = oldMxSelectionChange.prototype;

      // mxGraphHandler overrides to get previews of moving shapes
      // These overrides wrap the original implementations and additionally send messages to the "screensharee".
      // The screensharee uses this messages to draw previews at his side.

      // Begin of move
      const oldStart = this.graph.graphHandler.start;
      this.graph.graphHandler.start = function(cell, x, y, cells) {
        oldStart.apply(this, arguments);
        // cells that will be moved on our side
        cells = this.graph.graphHandler.getCells(cell);
        share("graphHandlerStart", {
          cellIds: cells.map(cell => cell.id),
          x, y
        });
      };
      // Redraw operation, caused by mouseMove event, during move
      const oldUpdateLivePreview = this.graph.graphHandler.updateLivePreview;
      this.graph.graphHandler.updateLivePreview = function(dx, dy) {
        oldUpdateLivePreview.apply(this, arguments);
        share("graphHandlerUpdateLivePreview", {dx, dy});
      }
      // End of move
      const oldReset = this.graph.graphHandler.reset;
      this.graph.graphHandler.reset = function() {
        oldReset.apply(this, arguments);
        share("graphHandlerReset", null); // no data
      };


      //// VERTEX HANDLER OVERRIDES -  a broken attempt at previewing resizing shapes ....

      // const oldVertexStart = mxVertexHandler.prototype.start;
      // mxVertexHandler.prototype.start = function(x, y, index) {
      //   console.log("begin resize", this, x, y , index);
      //   oldVertexStart.apply(this, arguments);
      //   shareFunctionCall("vertexHandlerStart", {
      //     cellId: this.state.cell.id,
      //     x, y,
      //     index, // number (0-7) of resize handle pressed
      //   });
      // }

      // const oldVertexReset = mxVertexHandler.prototype.reset;
      // mxVertexHandler.prototype.reset = function() {
      //   console.log("reset resize");
      //   oldVertexReset.apply(this, arguments);
      //   shareFunctionCall("vertexHandlerReset", {
      //     cellId: this.state.cell.id,
      //   });
      // }

      // const oldVertexUpdateLivePreview = mxVertexHandler.prototype.updateLivePreview;
      // mxVertexHandler.prototype.updateLivePreview = function(me) {
      //   console.log("update resize preview", me);
      //   oldVertexUpdateLivePreview.apply(this, arguments);
      //   shareFunctionCall("vertexHandlerUpdateLivePreview", {
      //     cellId: this.state.cell.id,
      //     bounds: {
      //       x: this.bounds.x,
      //       y: this.bounds.y,
      //       width: this.bounds.width,
      //       height: this.bounds.height,
      //     },
      //   });
      // }

      // Handler for incoming requests from other peers
      this.p2p = new PeerToPeer(client, {

        // Handlers for received mxGraphHandler messages that we sent above.

        // mxGraphHandler (moving cells)
        "graphHandlerStart": (from, {cellIds, x, y}, reply) => {
          if (this.sharingWith === from) {
            // the mxGraphHandler will determine the cells to move based on the current selection
            // a hack within a hack - we temporarily override 'getCells':
            const oldGetCells = this.graph.graphHandler.getCells;
            this.graph.graphHandler.getCells = function(initialCell) {
              return cellIds.map(id => this.graph.model.cells[id]);
            }
            oldStart.apply(this.graph.graphHandler, [
              null, // 'cells' - this argument isn't important since we overrided getCells
              x, y,
              null,
            ]);
            this.graph.graphHandler.checkPreview(); // force some stuff to happen
            this.graph.graphHandler.getCells = oldGetCells; // restore override
          }
          reply();
        },
        "graphHandlerUpdateLivePreview": (from, {dx,dy}, reply) => {
          if (this.sharingWith === from) {
            oldUpdateLivePreview.apply(this.graph.graphHandler, [dx, dy]);
          }
          reply();
        },
        "graphHandlerReset": (from, _, reply) => {
          if (this.sharingWith === from) {
            oldReset.apply(this.graph.graphHandler, []);
          }
          reply();
        },

        "undoEvent": (from, {encodedChanges, undone, redone, significant}, reply) => {
          if (this.sharingWith === from) {
            try {
              listenerEnabled = false;
              // Undoable Edit happened at other peer
              const changes = encodedChanges.map(encoded => {
                const change = this.decode(encoded);
                change.model = this.graph.model;
                return change
              });
              if (undone) {
                this.undoManager.undo();
              }
              else if (redone) {
                this.undoManager.redo();
              }
              else {
                // Probably not necessary to wrap in update-transaction, but won't do harm:
                this.graph.model.beginUpdate();
                changes.forEach(change => this.graph.model.execute(change));
                this.graph.model.endUpdate();
              }
            }
            finally {
              listenerEnabled = true;
              reply(); // acknowledge
            }
          }
        },

        "selectionEvent": (from, {addedIds, removedIds}, reply) => {
          if (this.sharingWith === from) {
            try {
              listenerEnabled = false;
              // Selection changed at other peer - lock selected cells
              const removed = removedIds.map(id => this.graph.model.cells[id]);
              const added = addedIds.map(id => this.graph.model.cells[id]);
              removed.forEach(unlockCell);
              added.forEach(lockCell);
            }
            finally {
              listenerEnabled = true;
              reply(); // acknowledge
            }
          }
        },

        // Received Screen Share request
        "init_screenshare": (from, {graphSerialized, selectedCellIds}, reply) => {
          const yes = () => {
            const doc = mxUtils.parseXml(graphSerialized);
            const codec = new mxCodec(doc);
            codec.decode(doc.documentElement, this.graph.model);
            selectedCellIds.forEach(id => lockCell(this.graph.model.cells[id]));
            this.sharingWith = from;
            reply(); // acknowledge
            this.alert("You are now <b>screen sharing</b> with " + shortUUID(from));
          };
          const no = () => {
            reply("denied")
          };
          this.confirm(`Peer ${shortUUID(from)} wants to <b>screen share</b>.<br />Your diagram will be erased and replaced by his/hers.<br /><br />Accept?`, yes, no);
        },

        "end_screenshare": (from, data, reply) => {
          reply();
          otherPeerEndScreenshare(from);
        }
      });

    }

    initshare(peer) {
      const doIt = () => {
        const graphSerialized = encode(this.graph.model);
        const selectedCellIds = this.graph.getSelectionCells().map(cell => cell.id);
        this.p2p.send(peer, "init_screenshare", {
          graphSerialized,
          selectedCellIds,
        }, (err, data) => {
          if (err) {
            if (err === "denied") {
              this.alert(`Peer ${peer} <b>denied</b> your sharing request :(`);
            } else {
              this.alert("Error sending screenshare request: " + err);
            }
          }
          else {
            this.alert("Accepted: You are now <b>screen sharing</b> with " + shortUUID(peer));
            this.sharingWith = peer;
          }
        });
        this.alert("Request sent. Awaiting response.")
      }

      if (this.sharingWith && this.sharingWith !== peer) {
        // first, end earlier screenshare
        const yes = () => {
          this.p2p.send(this.sharingWith, "end_screenshare", null, (err, data) => {
            // don't care about response
            doIt();
          })
        };
        const no = () => {
          // do nothing
        }
        this.confirm(`To screenshare with peer ${shortUUID(peer)}, you <b>first have to end your screenshare</b> with peer ${shortUUID(this.sharingWith)}.<br /><br />OK?`,
          yes, no);
      } else {
        doIt();
      }
    }
  }
})();
