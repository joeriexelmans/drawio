const decodeCells = xmlString => {
  const parsedXml = new DOMParser().parseFromString(xmlString, "text/xml").firstElementChild;
  const codec = new mxCodec();
  return codec.decode(parsedXml);
};

const encodeCells = cells => {
    const codec = new mxCodec();
    const encoded = codec.encode(cells);
    return new XMLSerializer().serializeToString(encoded);
};

class ScreenShare {
  constructor(client, graph, confirm, alert) {
    this.graph = graph;
    this.sharingWith = {};
    this.confirm = confirm;
    this.alert = alert;

    const shareEvent = serializer => {
      // return new event listener for mxEventSource:
      return (source, eventObj) => {
        const props = serializer(eventObj.properties);
        if (props !== undefined) {
          Object.keys(this.sharingWith).forEach(peer => {
            this.p2p.send(peer, "push_edit", {
              event: eventObj.name,
              props,
            }, (err, data) => {
              if (err) {}
              else {}
            });
          })
        }
      };
    };

    // We do not use these events because they are fired in the middle of an edit transaction (instead of at the end)
    // wrong: CELLS_ADDED(cells: Array[mxCell], parent: mxCell, index: int, absolute: bool)
    // wrong: CELLS_MOVED(cells: Array[mxCell], dx, dy)
    // wrong: CELLS_REMOVED(cells: Array[mxCell])

    // right: MOVE_CELLS(cells: Array{mxCell], clone: bool, dx, dy, target: mxCell, event: PointerEvent})
    this.graph.addListener(mxEvent.MOVE_CELLS, shareEvent(({cells, target, clone, dx, dy}) => {
      const data = {
        targetId: target ? target.id : null,
        clone, dx, dy,
      }
      if (clone) {
        // this is also true when a new cell was added
        return {
          ...data,
          cellsXml: encodeCells(cells),
        }
      } else {
        return {
          ...data,
          cellIds: cells.map(cell => cell.id),
        }
      }
    }))

    this.graph.addListener(mxEvent.REMOVE_CELLS, shareEvent(({cells, includeEdges}) => {
      if (cells.length > 0) {
        // for some reason moving cells causes REMOVE_CELLS to be fired with 0 cells - do not share the event in this case :)
        return {
          cellIds: cells.map(cell => cell.id),
          includeEdges,
        }
      }
    }))

    this.graph.addListener(mxEvent.RESIZE_CELLS, shareEvent(({cells, bounds, previous}) => {
      return {
        cellIds: cells.map(cell => cell.id),
        boundsXml: encodeCells(bounds),
      }
    }))

    // edge: mxCell
    // source: boolean (whether source of edge (=directed) was connected, or target)
    // terminal: mxCell to which connect happened (potentially undefined)
    // previous: mxCell from which disconnect happened (potentially undefined)
    this.graph.addListener(mxEvent.CONNECT_CELL, shareEvent(({edge, source, terminal, previous}) => {
      return {
        edgeId: edge.id,
        edgeGeometryXml: encodeCells(edge.geometry),
        source,
        terminalId: terminal ? terminal.id : null,
        previousId: previous ? previous.id : null,
      }
    }))

    // CELLS_RESIZED(cells: .., bounds: mxRectangle{x,y,width,height}, previous: Array[mxGeometry{x,y,width,height, ...}])
    // CELL_CONNECTED(edge, mxCell, source: bool, [terminal: mxCell,] [previous: mxCell])
    //   source: whether source of edge connected
    //   terminal: cell connected to
    //   previous: cell disconnected from

    // Handler for incoming requests from other peers
    this.p2p = new PeerToPeer(client, {
      // incoming request from another peer
      "push_edit": (from, {event, props}, reply) => {
        if (this.sharingWith[from]) {
          // received edit from other peer
          this.graph.setEventsEnabled(false);
          ({
            [mxEvent.MOVE_CELLS]: ({cellsXml, cellIds, targetId, clone, dx, dy}) => {
              const target = targetId !== null ? this.graph.model.cells[targetId] : undefined;
              if (clone) {
                const cells = decodeCells(cellsXml);
                const result = this.graph.moveCells(cells,
                  0, 0, // dx, dy - the cells themselves already contain the correct offset. using dx and dy would position them at twice their position-vector
                  false, // clone - not necessary because decodeCells already created the cells, we want to simply "move" them to the target. if true, the cells would be given new ids
                  target);
              } else {
                const cells = cellIds.map(id => this.graph.model.cells[id]);
                this.graph.moveCells(cells, dx, dy, clone, target);
              }
            },
            [mxEvent.REMOVE_CELLS]: ({cellIds, includeEdges}) => {
              const cells = cellIds.map(id => this.graph.model.cells[id]);
              this.graph.removeCells(cells, includeEdges);
            },
            [mxEvent.RESIZE_CELLS]: ({cellIds, boundsXml}) => {
              const cells = cellIds.map(id => this.graph.model.cells[id]);
              const bounds = decodeCells(boundsXml);
              this.graph.resizeCells(cells, bounds,
                false); // recurse
            },
            [mxEvent.CONNECT_CELL]: ({edgeId, edgeGeometryXml, source, terminalId, previousId}) => {
              const edge = this.graph.model.cells[edgeId];
              const geometry = decodeCells(edgeGeometryXml);
              const terminal = terminalId !== null ? this.graph.model.cells[terminalId] : undefined;
              const previous = previousId !== null ? this.graph.model.cells[previousId] : undefined;
              edge.setGeometry(geometry);
              this.graph.connectCell(edge, terminal, source,
                null); // "constraint". the docs say: optional <mxConnectionConstraint>. are we missing something here?
            },
          }[event])(props);
          this.graph.setEventsEnabled(true);
          reply(); // acknowledge
        }
      },
      "init_screenshare": (from, graphSerialized, reply) => {
        const yes = () => {
          const cells = decodeCells(graphSerialized);
          this.graph.model.clear();
          this.graph.importCells(cells);
          this.sharingWith[from] = true;
          reply(); // acknowledge
        };
        const no = () => {
          reply("denied")
        };
        this.confirm(`Peer ${shortUUID(from)} wants to <b>screen share</b>.<br /><br />Accept?`, yes, no);
      },
    });
  }

  initshare(peer) {
    const graphSerialized = encodeCells(Object.values(this.graph.model.cells));
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
