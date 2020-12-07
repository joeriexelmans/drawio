async function getMessagingClient(ui)
{
  const p = Promise.all([
    loadScript("/websockets/common.js"),
    loadScript("/websockets/client.js"),
  ]);

  ui.toolbar.addSeparator();



  // button.appendChild(status)

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

  const client = new Client(websocketOrigin + "/websocket");

  client.on('disconnected', () => {
    status.textContent = "Disconnected";
  })

  client.on('receivePush', (what, data) => {
    if (what === "peers") {
      status.textContent = "Connected as Peer " + data.you;
    }
  });

  return client;
}
