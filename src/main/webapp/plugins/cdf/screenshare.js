Draw.loadPlugin(async function(ui) {

  const graph = ui.editor.graph;

  // all peers
  let peers = [];

  // peers screensharing with
  let sharingWith = [];

  window.ui = ui;

  // Add toolbar buttons
  ui.toolbar.addSeparator();

  ui.menus.put('screenshare', new Menu(function(menu, parent) {
    console.log(menu)
    if (peers.length > 0) {
      peers.forEach(peer => {
        menu.addItem("Peer " + shortUUID(peer), null, function() {
          const graphXml = ui.editor.getGraphXml();
          const graphSerialized = new XMLSerializer().serializeToString(graphXml);
          p2p.send(peer, "init_screenshare", graphSerialized, (err, data) => {
            if (err) {
              alert(err)
            }
            else {
              sharingWith.push(peer);
            }
          });
        }, menu);
      })      
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

  const decodeGraph = xmlString => {
    const parsedXml = new DOMParser().parseFromString(data, "text/xml").firstElementChild;
    const codec = new mxCodec();
    return codec.decode(parsedXml);
  };

  const encodeGraph = cells => {
      const codec = new mxCodec();
      const encoded = codec.encode(selectedCells);
      return new XMLSerializer().serializeToString(encoded);
  };


  // Events we should listen for:
  //
  // CELLS_ADDED(cells: Array[mxCell], parent: mxCell, index: int, absolute: bool)
  //   -> what's index, absolute?
  //
  // CELLS_MOVED(cells: Array[mxCell], dx, dy)
  //
  // CELLS_REMOVED(cells: Array[mxCell])
  //
  // CELLS_RESIZED(cells: .., bounds: mxRectangle{x,y,width,height}, previous: Array[mxGeometry{x,y,width,height, ...}])
  //
  // CELL_CONNECTED(edge, mxCell, source: bool, [terminal: mxCell,] [previous: mxCell])
  //   source: whether source of edge connected
  //   terminal: cell connected to
  //   previous: cell disconnected from


  const sendEvent = serializer => {
    // return new event listener for mxEventSource:
    return (source, eventObj) => {
      sharingWith.forEach(peer => {
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

  graph.addListener(mxEvent.CELLS_ADDED, sendEvent(props => {
    return {
      cells: encodeGraph(props.cells),
      parentId: props.parent.id,
      // also: index: int, absolute: bool ?
    }
  }))

  graph.addListener(mxEvent.CELLS_MOVED, sendEvent(props => {
    return {
      cellIds: props.cells.map(cell => cell.id),
      disconnect: props.disconnect, // bool
      dx: props.dx,
      dy: props.dy,
    }
  }))

  const pushEditHandlers = {};
  pushEditHandlers[mxEvent.CELLS_ADDED] = props => {
    const cells = decodeGraph(props.cells);
    graph.importCells(cells,
      0, 0, // dx, dy
      graph.cells[props.parentId]); // parent
  }
  pushEditHandlers[mxEvent.CELLS_MOVED] = props => {
    const cells = data.props.cellIds.map(id => graph.model.cells[id]);
    graph.moveCells(cells,
      data.props.dx, data.props.dy,
      false, // clone
      null); // target (new parent)
  }
  pushEditHandlers[mxEvent.CELLS_REMOVED] = props => {
  }
  pushEditHandlers[mxEvent.CELLS_RESIZED] = props => {
  }
  pushEditHandlers[mxEvent.CELL_CONNECTED] = props => {
  }

  const p2p = new PeerToPeer(client, {
    // incoming request from another peer
    "push_edit": (from, data, reply) => {
      if (sharingWith.hasOwnProperty(from)) {
        // an edit operation happened at other peer
        console.log("received shapes from peer", from);
        console.log("data:", data);
        pushEditHandlers[data.event](data.props);
        reply(); // acknowledge
      }
    },
    "init_screenshare": (from, graphSerialized, reply) => {
      const yesClicked = () => {
        const graphParsed = mxUtils.parseXml(graphSerialized).documentElement;
        ui.editor.setGraphXml(graphParsed);
        sharingWith.push(from);
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
      ui.showDialog(popupDiv, 250, 110,
        false, // modal
        false); // closable
    },
  });

  client.connect()
});