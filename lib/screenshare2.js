ScreenShare = (function() {

  function encode(cells) {
    const codec = new mxCodec();
    const encoded = codec.encode(cells);
    return mxUtils.getXml(encoded);
  };


  return class {

    constructor(client, graph, confirm, alert) {
      this.graph = graph;
      this.sharingWith = {};
      this.confirm = confirm;
      this.alert = alert;

      let listenerEnabled = true;

      const share = (what, data, callback) => {
        Object.keys(this.sharingWith).forEach(peer => {
          this.p2p.send(peer, what, data, callback);
        })
      }

      const shareEvent = serializer => {
        // return new event listener for mxEventSource:
        return (source, eventObj) => {
          if (listenerEnabled) {
            const props = serializer(eventObj.properties);
            if (props !== undefined) {
              share("push_edit", {
                event: eventObj.name,
                props,
              }, (err) => {
                if (err) console.log(err);
              });
            }
          }
        };
      };

      const shareFunctionCall = (what, data) => {
        if (listenerEnabled) {
          share(what, data, err => {
            if (err) console.log(err);
          });
        }
      }


      // Our event listener, serializing and sending events to other peers
      this.graph.model.addListener(mxEvent.NOTIFY,
        shareEvent(({edit: {changes}}) => changes.map(change => encode(change))));

      // To get 'live previews', we override a few mxGraphHandler functions

      const oldStart = this.graph.graphHandler.start;
      this.graph.graphHandler.start = function(cell, x, y, cells) {
        oldStart.apply(this, arguments);
        // cells that will be moved on our side
        cells = this.graph.graphHandler.getCells(cell);
        shareFunctionCall("graphHandlerStart", {
          cellIds: cells.map(cell => cell.id),
          x, y });
      };

      const oldReset = this.graph.graphHandler.reset;
      this.graph.graphHandler.reset = function() {
        oldReset.apply(this, arguments);
        shareFunctionCall("graphHandlerReset", null); // no data
      };

      const oldUpdateLivePreview = this.graph.graphHandler.updateLivePreview;
      this.graph.graphHandler.updateLivePreview = function(dx, dy) {
        oldUpdateLivePreview.apply(this, arguments);
        shareFunctionCall("graphHandlerUpdateLivePreview", {dx, dy});
      }


      // const oldVertexStart = mxVertexHandler.prototype.start;
      // mxVertexHandler.prototype.start = function(x, y, index) {
      //   console.log("begin resize");
      //   oldVertexStart.apply(this, arguments);
      //   shareFunctionCall("vertexHandlerStart", {x,y,index});
      // }

      // const oldVertexReset = mxVertexHandler.prototype.reset;
      // mxVertexHandler.prototype.reset = function() {
      //   console.log("reset resize");
      //   oldVertexReset.apply(this, arguments);
      //   shareFunctionCall("vertexHandlerReset", null);
      // }

      // const oldVertexUpdateLivePreview = mxVertexHandler.prototype.updateLivePreview;
      // mxVertexHandler.prototype.updateLivePreview = function({graphX, graphY, sourceState, state}) {
      //   oldUpdateLivePreview.apply(this, arguments);
      //   shareFunctionCall("vertexHandlerUpdateLivePreview", {
      //     { graphX, graphY, sourceCellId: sourceState.cell.id, cellId: state.cell.id });
      // }


      // Handler for incoming requests from other peers
      this.p2p = new PeerToPeer(client, {
        // mxGraphHandler (moving cells)
        "graphHandlerStart": (from, {cellIds, x, y}, reply) => {
          if (this.sharingWith[from]) {
            // the mxGraphHandler will determine the cells to move based on the current selection
            // we temporarily override this:
            const oldGetCells = this.graph.graphHandler.getCells;
            this.graph.graphHandler.getCells = function(initialCell) {
              return cellIds.map(id => this.graph.model.cells[id]);
            }
            oldStart.apply(this.graph.graphHandler, [
              null, // this argument isn't important since we overrided getCells
              x, y,
              null,
            ]);
            this.graph.graphHandler.checkPreview();
            this.graph.graphHandler.getCells = oldGetCells;
          }
          reply();
        },
        "graphHandlerUpdateLivePreview": (from, {dx,dy}, reply) => {
          if (this.sharingWith[from]) {
            // this.graph.graphHandler.checkPreview();
            oldUpdateLivePreview.apply(this.graph.graphHandler, [dx, dy]);
          }
          reply();
        },
        "graphHandlerReset": (from, _, reply) => {
          if (this.sharingWith[from]) {
            // this.graph.graphHandler.resetLivePreview();
            oldReset.apply(this.graph.graphHandler, []);
          }
          reply();
        },
        // // mxVertexHandler (resizing cells)
        // "vertexHandlerStart": (from, {cellId, cellIds, x, y}, reply) => {
        //   if (this.sharingWith[from]) {
        //     listenerEnabled = false;
        //     oldStart.apply(this.graph.graphHandler, [
        //       this.graph.model.cells[cellId],
        //       x, y,
        //       null, // 'cells'
        //     ]);
        //     this.graph.graphHandler.checkPreview();
        //     listenerEnabled = true;
        //   }
        //   reply();
        // },
        // "graphHandlerUpdateLivePreview": (from, {dx,dy}, reply) => {
        //   if (this.sharingWith[from]) {
        //     listenerEnabled = false;
        //     // this.graph.graphHandler.checkPreview();
        //     oldUpdateLivePreview.apply(this.graph.graphHandler, [dx, dy]);
        //     listenerEnabled = true;
        //   }
        //   reply();
        // },
        // "vertexHandlerReset": (from, _, reply) => {
        //   if (this.sharingWith[from]) {
        //     listenerEnabled = false;
        //     // this.graph.graphHandler.resetLivePreview();
        //     oldReset.apply(this.graph.graphHandler, []);
        //     listenerEnabled = true;
        //   }
        //   reply();
        // },

        // undoable edit
        "push_edit": (from, {event, props}, reply) => {
          if (this.sharingWith[from]) {
            // temporary disable our listener, we don't want to echo our received edit
            listenerEnabled = false;
            ({
              [mxEvent.NOTIFY]: encodedChanges => {
                const codec = new mxCodec();
                codec.lookup = id => this.graph.model.cells[id];
                const changes = encodedChanges.map(encoded => {
                  const parsedXml = mxUtils.parseXml(encoded).documentElement;
                  const change = codec.decode(parsedXml);
                  change.model = this.graph.model;
                  return change
                });
                console.log(changes);
                changes.forEach(change => this.graph.model.execute(change));
              },
            }[event])(props);
            listenerEnabled = true;
            reply(); // acknowledge
          }
        },
        "init_screenshare": (from, graphSerialized, reply) => {
          const yes = () => {
            const doc = mxUtils.parseXml(graphSerialized);
            const codec = new mxCodec(doc);
            codec.decode(doc.documentElement, this.graph.model);
            this.sharingWith[from] = true;
            reply(); // acknowledge
            this.alert("You are now <b>screen sharing</b> with " + shortUUID(from));
          };
          const no = () => {
            reply("denied")
          };
          this.confirm(`Peer ${shortUUID(from)} wants to <b>screen share</b>.<br />Your diagram will be erased and replaced by his/hers.<br /><br />Accept?`, yes, no);
        },
      });
    }

    initshare(peer) {
      const graphSerialized = encode(this.graph.model);
      this.p2p.send(peer, "init_screenshare", graphSerialized, (err, data) => {
        if (err) {
          this.alert(err)
        }
        else {
          this.alert("Accepted: You are now <b>screen sharing</b> with " + shortUUID(peer));
          this.sharingWith[peer] = true;
        }
      });
    }
  }
})();
