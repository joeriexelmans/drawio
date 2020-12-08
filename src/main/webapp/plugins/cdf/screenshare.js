Draw.loadPlugin(async function(ui) {

  window.ui = ui; // global variable for debugging
  const graph = ui.editor.graph;

  // all peers
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
      Object.keys(sharingWith).forEach(peer => {
        p2p.send(peer, "push_edit", {
          event: eventObj.name,
          props: serializer(eventObj.properties),
        }, (err, data) => {
          if (err) {}
          else {}
        });
      })
    };
  };

  // // CELLS_ADDED(cells: Array[mxCell], parent: mxCell, index: int, absolute: bool)
  // //   -> what's index, absolute?
  // graph.addListener(mxEvent.CELLS_ADDED, shareEvent(({cells, parent, index, absolute}) => {
  //   return {
  //     cells: encodeCells(cells),
  //     parentId: parent.id,
  //     index,
  //     absolute,
  //   }
  // }))

  // wrong: CELLS_MOVED(cells: Array[mxCell], dx, dy)
  // right: MOVE_CELLS(cells: Array{mxCell], clone: bool, dx, dy, target: mxCell, event: PointerEvent})
  graph.addListener(mxEvent.MOVE_CELLS, shareEvent(({cells, target, clone, dx, dy}) => {
    const data = {
      targetId: target ? target.id : null,
      clone, dx, dy,
    }
    if (clone) {
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

  // CELLS_REMOVED(cells: Array[mxCell])
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
          // [mxEvent.CELLS_ADDED]: ({cells, parentId, index, absolute}) => {
          //   console.log("SCREENSHARE: CELLS_ADDED")
          //   const cells = decodeCells(cells);
          //   graph.importCells(cells,
          //     0, 0, // dx, dy
          //     graph.model.cells[parentId]); // parent
          // },
          [mxEvent.MOVE_CELLS]: ({cellsXml, cellIds, targetId, clone, dx, dy}) => {
            const target = targetId !== null ? graph.model.cells[targetId] : undefined;
            if (clone) {
              const cells = decodeCells(cellsXml);
              console.log("IMPORT CELLS", cells, "TARGET", target);
              const result = graph.moveCells(cells, 0, 0, false, target);
              console.log("IMPORTED:", result)
            } else {
              const cells = cellIds.map(id => graph.model.cells[id]);
              console.log("MOVE CELLS", cells, "TARGET", target);
              graph.moveCells(cells, dx, dy, clone, target);
            }
          },
          // [mxEvent.CELLS_REMOVED]: props => {

          // },
          // [mxEvent.CELLS_RESIZED]: props => {

          // },
          // [mxEvent.CELL_CONNECTED]: props => {

          // },
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