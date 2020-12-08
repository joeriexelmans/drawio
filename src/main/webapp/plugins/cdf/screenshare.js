Draw.loadPlugin(async function(ui) {

  window.ui = ui; // global variable for debugging
  const graph = ui.editor.graph;

  // all known peers
  let peers = [];

  // peers screensharing with
  let sharingWith = {};

  const p = loadScript("plugins/cdf/messaging.js");
  await p;

  client = await getMessagingClient(ui);
  client.on('receivePush', (what, data) => {
    if (what === "peers") {
      you = data.you;
      peers = data.peers.filter(p => p !== you);
    }
  });

  client.on('disconnected', () => {
    peers = []
  })

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

  const shareEvent = serializer => {
    // return new event listener for mxEventSource:
    return (source, eventObj) => {
      const props = serializer(eventObj.properties);
      if (props !== undefined) {
        Object.keys(sharingWith).forEach(peer => {
          p2p.send(peer, "push_edit", {
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
  graph.addListener(mxEvent.MOVE_CELLS, shareEvent(({cells, target, clone, dx, dy}) => {
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

  graph.addListener(mxEvent.REMOVE_CELLS, shareEvent(({cells, includeEdges}) => {
    if (cells.length > 0) {
      // for some reason moving cells causes REMOVE_CELLS to be fired with 0 cells - do not share the event in this case :)
      return {
        cellIds: cells.map(cell => cell.id),
        includeEdges,
      }
    }
  }))

  graph.addListener(mxEvent.RESIZE_CELLS, shareEvent(({cells, bounds, previous}) => {
    return {
      cellIds: cells.map(cell => cell.id),
      boundsXml: encodeCells(bounds),
    }
  }))

  // edge: mxCell
  // source: boolean (whether source of edge (=directed) was connected, or target)
  // terminal: mxCell to which connect happened (potentially undefined)
  // previous: mxCell from which disconnect happened (potentially undefined)
  graph.addListener(mxEvent.CONNECT_CELL, shareEvent(({edge, source, terminal, previous}) => {
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
  const p2p = new PeerToPeer(client, {
    // incoming request from another peer
    "push_edit": (from, {event, props}, reply) => {
      if (sharingWith[from]) {
        // received edit from other peer
        graph.setEventsEnabled(false);
        ({
          [mxEvent.MOVE_CELLS]: ({cellsXml, cellIds, targetId, clone, dx, dy}) => {
            const target = targetId !== null ? graph.model.cells[targetId] : undefined;
            if (clone) {
              const cells = decodeCells(cellsXml);
              const result = graph.moveCells(cells,
                0, 0, // dx, dy - the cells themselves already contain the correct offset. using dx and dy would position them at twice their position-vector
                false, // clone - not necessary because decodeCells already created the cells, we want to simply "move" them to the target. if true, the cells would be given new ids
                target);
            } else {
              const cells = cellIds.map(id => graph.model.cells[id]);
              graph.moveCells(cells, dx, dy, clone, target);
            }
          },
          [mxEvent.REMOVE_CELLS]: ({cellIds, includeEdges}) => {
            const cells = cellIds.map(id => graph.model.cells[id]);
            graph.removeCells(cells, includeEdges);
          },
          [mxEvent.RESIZE_CELLS]: ({cellIds, boundsXml}) => {
            const cells = cellIds.map(id => graph.model.cells[id]);
            const bounds = decodeCells(boundsXml);
            graph.resizeCells(cells, bounds,
              false); // recurse
          },
          [mxEvent.CONNECT_CELL]: ({edgeId, edgeGeometryXml, source, terminalId, previousId}) => {
            const edge = graph.model.cells[edgeId];
            const geometry = decodeCells(edgeGeometryXml);
            const terminal = terminalId !== null ? graph.model.cells[terminalId] : undefined;
            const previous = previousId !== null ? graph.model.cells[previousId] : undefined;
            edge.setGeometry(geometry);
            graph.connectCell(edge, terminal, source,
              null); // "constraint". the docs say: optional <mxConnectionConstraint>. are we missing something here?
          },
        }[event])(props);
        graph.setEventsEnabled(true);
        reply(); // acknowledge
      }
    },
    "init_screenshare": (from, graphSerialized, reply) => {
      const yesClicked = () => {
        const graphParsed = mxUtils.parseXml(graphSerialized).documentElement;
        ui.editor.setGraphXml(graphParsed);
        sharingWith[from] = true;
        reply(); // acknowledge
        ui.hideDialog()
      }
      const noClicked = () => {
        reply("denied")
        ui.hideDialog()
      }
      // create dialog
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `Peer ${shortUUID(from)} wants to <b>screenshare</b>.<br /><br />Accept?`;
      const buttons = document.createElement('div')
      const yesButton = mxUtils.button("Yes", yesClicked);
      yesButton.className = 'geBtn';
      const noButton = mxUtils.button("No", noClicked);
      noButton.className = 'geBtn';
      buttons.appendChild(yesButton);
      buttons.appendChild(noButton);
      buttons.style.marginTop = '30px';
      popupDiv.appendChild(buttons);
      popupDiv.style.textAlign = 'center';
      ui.showDialog(popupDiv,
        250, 110, // w, h
        false, // modal
        false); // closable
    },
  });

  const initShare = peer => {
    const graphXml = ui.editor.getGraphXml();
    const graphSerialized = new XMLSerializer().serializeToString(graphXml);
    p2p.send(peer, "init_screenshare", graphSerialized, (err, data) => {
      if (err) {
        alert(err)
      }
      else {
        sharingWith[peer] = true;
      }
    });
  }

  client.connect();


  // UI stuff
  ui.toolbar.addSeparator();
  ui.menus.put('screenshare', new Menu(function(menu, parent) {
    if (peers.length > 0) {
      peers.forEach(peer => {
        menu.addItem("Peer " + shortUUID(peer), null, () => initShare(peer), menu);
      });
    } else {
      menu.addItem("No peers ", null, null, menu, null, false);
    }
  }))
  const screenshareMenu = ui.toolbar.addMenu('', "Share screen with another user", true, 'screenshare');
  screenshareMenu.style.width = '100px';
  screenshareMenu.showDisabled = true;
  screenshareMenu.style.whiteSpace = 'nowrap';
  screenshareMenu.style.position = 'relative';
  screenshareMenu.style.overflow = 'hidden';
  screenshareMenu.innerHTML = "Screen Share" + ui.toolbar.dropdownImageHtml;
});