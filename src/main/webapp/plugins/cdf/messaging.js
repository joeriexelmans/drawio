async function getMessagingClient(ui)
{
  // Load scripts in the right order
  const p = Promise.all([
      loadScript("../../../websockets/common.js"),
      loadScript("../../../websockets/uuidv4.min.js"),
    ]).then(() => loadScript("../../../websockets/client.js"));

  // Display Connected/Disconnected status on toolbar
  ui.toolbar.addSeparator();
  const statusDiv = document.createElement('div');
  statusDiv.classList.add("geLabel");
  statusDiv.style = "white-space: nowrap; position: relative;";
  const status = document.createTextNode("Disconnected");
  statusDiv.appendChild(status);
  ui.toolbar.container.appendChild(statusDiv);

  let websocketOrigin;
  if (document.location.protocol === "https:") {
    websocketOrigin = "wss://" + document.location.origin.substring(8);
  } else {
    websocketOrigin = "ws://" + document.location.origin.substring(7);
  }

  await p;

  const ourId = uuidv4();
  const client = new Client(websocketOrigin + "/websocket", ourId);

  client.on('disconnected', () => {
    status.textContent = "Disconnected";
  })

  client.on('receivePush', (what, data) => {
    if (what === "peers") {
      status.textContent = "Connected as Peer " + shortUUID(data.you);
    }
  });

  return client;
}
