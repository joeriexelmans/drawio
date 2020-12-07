Draw.loadPlugin(async function(ui) {

  let peers = [];

  console.log(ui);

  // Add toolbar buttons
  ui.toolbar.addSeparator();

  ui.menus.put('screenshare', new Menu(mxUtils.bind(ui.menus, function(menu, parent) {
    console.log(menu)
    if (peers.length > 0) {
      peers.forEach(peer => {
        menu.addItem("Peer " + peer, null, null, menu, null, false);
      })      
    } else {
      menu.addItem("No peers ", null, null, menu, null, false);
    }
  })))

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

  // // Events we should listen for:
  // //  CELLS_ADDED
  // //  CELLS_MOVED
  // //  CELLS_REMOVED
  // //  CELLS_RESIZED
  // //  CELL_CONNECTED

  // graph.addListener(mxEvent.CELLS_ADDED, (source, eventObj) => {

  // })

  client.connect()
});