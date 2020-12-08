Draw.loadPlugin(async function(ui) {

  window.ui = ui; // global variable for debugging
  const graph = ui.editor.graph;

  await Promise.all([
    loadScript("plugins/cdf/messaging.js"),
    loadScript("../../../lib/screenshare.js"),
    loadScript("../../../lib/peers.js"),
    loadScript("../../../lib/uitools.js"),
  ]);

  client = await getMessagingClient(ui);

  const peers = new Peers(client);

  const uiTools = new UiTools(ui);

  const screenShare = new ScreenShare(client, graph, uiTools.yesNo.bind(uiTools), ui.showAlert.bind(ui));

  client.connect();

  // UI stuff
  ui.toolbar.addSeparator();
  ui.menus.put('screenshare', new Menu(function(menu, parent) {
    if (peers.peers.length > 0) {
      peers.peers.forEach(peer => {
        menu.addItem("Peer " + shortUUID(peer), null, () => screenShare.initshare(peer), menu);
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