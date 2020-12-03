// common.js //

class RequestReply {
  constructor() {
    this.nextId = 0;
    this.pending = {};
  }

  createRequest(what, data, responseCallback) {
    const id = this.nextId++;
    const request = {type: "req", id, what, data};
    // store the request itself, so we can retransmit it if necessary
    this.pending[id] = [request, responseCallback];
    return request;
  }

  handleResponse({id, err, data}) {
    if (this.pending.hasOwnProperty(id)) {
      const [, responseCallback] = this.pending[id];
      delete this.pending[id];
      if (responseCallback) {
        responseCallback(err, data);
      }
    }
  }

  getPending() {
    return Object.values(this.pending);
  }

  clearPending() {
    this.pending = {};
  }
}


class Timer {
  constructor(duration, callback) {
    this.duration = duration;
    this.callback = callback;
    this.id = null;
  }

  // (re)sets timer
  set() {
    clearTimeout(this.id);
    this.id = setTimeout(() => {
      this.callback();
    }, this.duration);
  }

  unset() {
    clearTimeout(this.id);
  }
}

// client.js //


// Client parameters

// If connection to server does not succeed within this amount of time, try again.
// const RECONNECT_INTERVAL = 2000; // ms

const PING_INTERVAL = 1000; // ms

// After not having received anything from the server for this amount of time, reconnect.
const SERVER_TIMEOUT = 4000; // ms


function recvJSON(data) {
  const parsed = JSON.parse(data) // may throw
  if (parsed.type !== "pong") console.log("--> ", parsed);
  return parsed;
}

class Client {

  constructor(addr) {
    this.addr = addr;

    this.eventHandlers = {
      connected: [],
      disconnected: [],
      receivePush: [],
      receiveReq: [],
    };

    this.socket = null;
    this.socket_number = -1;
    this.sockets = 0;

    this.requestReply = new RequestReply();

    // This timer is reset each time we send anything to the server.
    // upon timeout, we send a ping
    this.sendPingTimer = new Timer(PING_INTERVAL, () => {
      this.socket.sendJSON({ type: "ping" });
      this.sendPingTimer.set(); // schedule next ping
    });

    // this timer is reset each time we receive anything from the server.
    // upon timeout, connection is considered dead
    this.serverTimeoutTimer = new Timer(SERVER_TIMEOUT, () => {
      console.log("server timeout..")
      this.connect();
    });
  }

  on(event, handler) {
    this.eventHandlers[event].push(handler);
  }

  // (re)connects to server
  connect() {
    this.sendPingTimer.unset();

    if (this.socket !== null) {
      console.log("force disconnect socket ", this.socket_number)
      this.eventHandlers.disconnected.forEach(h => h());
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.close();
    }

    const socket = new WebSocket(this.addr);
    const socket_number = this.sockets++;
    console.log("new socket", socket_number)

    this.serverTimeoutTimer.set();

    socket.sendJSON = function(json) {
      if (json.type !== "ping") console.log("<-- ", json);
      this.send(JSON.stringify(json));
    }

    socket.onmessage = (event) => {
      let parsed;
      try {
        parsed = recvJSON(event.data);
      } catch (e) {
        return; // ignore unparsable messages
      }

      this.serverTimeoutTimer.set();

      if (parsed.type === "res") {
        this.requestReply.handleResponse(parsed);
      }
      else if (parsed.type === "push") {
        const {what, data} = parsed;
        this.eventHandlers.receivePush.forEach(h => h(what, data));
      }
      else if (parsed.type === "req") {
        const {id, what, data} = parsed;
        const reply = (err, data) => {
          socket.sendJSON({type:"res", id, err, data});
        }
        this.eventHandlers.receiveReq.forEach(h => h(what, data, reply));
      }
    }

    socket.onopen = () => {
      console.log("socket.onopen", socket_number)
      // Connected!
      socket.onclose = e => {
        console.log("socket.onclose", e, "socket_number", socket_number)
        this.eventHandlers.disconnected.forEach(h => h());
        this.sendPingTimer.unset();
        this.connect();
      }

      // resend pending requests
      this.requestReply.getPending().forEach(([req,]) => {
        socket.sendJSON(req);
      });

      this.sendPingTimer.set();
      this.serverTimeoutTimer.set();

      this.eventHandlers.connected.forEach(h => h(socket));
    }

    this.socket = socket;
    this.socket_number = socket_number;
  }

  request(what, data, callback) {
    const req = this.requestReply.createRequest(what, data, callback);
    this.socket.sendJSON(req);
    this.sendPingTimer.set();
  }
}

class PeerToPeer {
  constructor(client, handlers) {
    this.client = client;

    this.client.on('receiveReq', (what, data, reply) => {
      if (what === "msg") {
        const {from, msg} = data;
        if (handlers.hasOwnProperty(msg.what)) {
          handlers[msg.what](from, msg.data, reply);
        }
      }
    });
  }

  send(to, what, data, callback) {
    this.client.request("forw", { to, msg: { what, data } }, callback);
  }
}


Draw.loadPlugin(function(ui) {

  const graph = ui.editor.graph;

  console.log(ui);

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