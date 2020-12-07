// TODO: Ask the folks at drawio whether plugin loading really needs to be synchronous
Draw.loadPlugin(async function(ui) {

  const loadScript = (path, onload) => {
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.onload = resolve;
      tag.src = path;
      document.head.appendChild(tag);
    })
  }

  await loadScript("/websockets/common.js");
  await loadScript("/websockets/client.js");

  const graph = ui.editor.graph;

  ui.toolbar.addSeparator();
  const statusDiv = document.createElement('div');
  const status = document.createTextNode("Disconnected");
  statusDiv.appendChild(status);
  ui.toolbar.container.appendChild(statusDiv)

  let peers;
  let you;

  const oldFactoryMethod = graph.popupMenuHandler.factoryMethod;

  const newFactoryMethod = function(menu, cell, evt) {
    // build default context menu
    oldFactoryMethod.apply(this, arguments);

    // add submenu at the end
    const selectedCells = graph.getSelectionCells()
    if (selectedCells.length > 0) {
      console.log("selected:", selectedCells);
      const codec = new mxCodec();
      const encoded = codec.encode(selectedCells);

      const submenu = menu.addItem("Send to", null);
      menu.addItem("You are peer " + you, null, null, submenu, null, false);
      if (peers.length > 0) {
        peers.forEach(peer => {
          menu.addItem("Peer " + peer, null, function() {
            const serializedShapes = new XMLSerializer().serializeToString(encoded);
            p2p.send(peer, "shapes", serializedShapes, (err, data) => {
              if (err) {
                alert("Error:" + err + " (see console for details)");
                console.log("err", err, "data", data)
              }
            })
          }, submenu);
        })
      } else {
        menu.addItem("No peers", null, null, submenu, null, false);
      }
    }
  }


  let websocketOrigin;
  if (document.location.protocol === "https:") {
    websocketOrigin = "wss://" + document.location.origin.substring(8);
  } else {
    websocketOrigin = "ws://" + document.location.origin.substring(7);
  }

  const client = new Client(websocketOrigin + "/websocket");

  client.on('disconnected', () => {
    status.textContent = "Disconnected";
    graph.popupMenuHandler.factoryMethod = oldFactoryMethod;
  })

  client.on('receivePush', (what, data) => {
    if (what === "peers") {
      you = data.you;
      peers = data.peers.filter(p => p !== you);

      status.textContent = "Connected as Peer " + you;
      graph.popupMenuHandler.factoryMethod = newFactoryMethod;
    }
  });

  const p2p = new PeerToPeer(client, {
    // incoming request from another peer
    "shapes": (from, data, reply) => {
      console.log("received shapes from peer", from);
      console.log("data:", data);

      const parsedXml = new DOMParser().parseFromString(data, "text/xml").firstElementChild;
      const codec = new mxCodec();
      const cells = codec.decode(parsedXml);
      graph.importCells(cells);

      reply(); // acknowledge
    },
  });

  client.connect();
});