const CLIENT_PING_INTERVAL = 300; // ms, interval for sending ping to server
const SERVER_TIMEOUT = 1000; // ms, time before lack of server response is considered a timeout
const TIMEOUT_THRESHOLD = 3; // number of missed replies

class Client {
  constructor(onpush) {
    this.socket = null;
    this.timeoutCtr = 0;
    this.reqCtr = 0;
    this.requests = {};
    this.onpush = onpush;

    this.clientTimeout = null; // after this timeout, the client will send a ping
    this.serverTimeout = null; // after this timeout, a request to the server is considered 'timed out'
  }

  connect(addr) {
    this.socket = new WebSocket(addr);

    this.socket.onmessage = msg => {
      const parsed = JSON.parse(msg.data)
      // if (parsed.param !== undefined || parsed.err !== undefined) {
        console.log("Received", parsed);
      // }
      
      const {reqId, param, err, what} = parsed;

      // response to a request
      if (reqId !== undefined && reqId in this.requests) {
        const callback = this.requests[reqId];
        delete this.requests[reqId];
        callback(err, param);
      }
      // server push
      else if (what !== undefined) {
        this.onpush(what, param);
      }
    }

    // this.socket.onopen = () => {
    //   // start sending pings
    //   this._resetClientTimeout();
    // };

    // this.socket.onclose = () => {
    //   if (this.clientTimeout !== null) {
    //     window.clearTimeout(this.clientTimeout);
    //   }
    // }
  }

  // _resetClientTimeout() {
  //     if (this.clientTimeout !== null) {
  //       window.clearInterval(this.clientTimeout);
  //     }
  //     this.clientTimeout = window.setTimeout(() => {
  //       this.request("ping", null, () => {});
  //       this.clientTimeout = null;
  //     }, CLIENT_PING_INTERVAL);
  // }

  request(cmd, param, callback) {
    if (this.socket == null) {
      callback("not connected");
    }

    const reqId = this.reqCtr++;

    this.socket.send(JSON.stringify({
      reqId,
      cmd,
      param,
    }));

    // const serverTimeout = window.setTimeout(() => {
    //   this.timeoutCtr++;
    //   delete this.requests[reqId];

    //   if (timeoutCtr > TIMEOUT_THRESHOLD) {
    //     socket = null;
    //     console.log("Server timeout")
    //   }
    // }, SERVER_TIMEOUT);

    // // delay next ping
    // this._resetClientTimeout();

    this.requests[reqId] = (err, data) => {
      // window.clearTimeout(serverTimeout);
      callback(err, data);
    };
  }

  disconnect() {
    this.request("leave", null, (err, data) => {})
  }
}


Draw.loadPlugin(function(ui) {

let peers = [];

const client = new Client((what, param) => {
  switch (what) {
  case "setPeers":
    peers = param.peers;
    peers.push(param.you);
    console.log("Peers:", peers);
    break;
  case "narrowcast":
    const {from, reqId, msg} = param;
    const parsed = new DOMParser().parseFromString(msg, "text/xml").firstElementChild;
    console.log("parsed:", parsed)
    const codec = new mxCodec();
    const decoded = codec.decode(parsed);
    console.log("decoded:", decoded);
    graph.importCells(decoded);
    break;
  }
});

client.connect("ws://localhost:8010/");

window.onbeforeunload = function(){
  client.disconnect();
}

const graph = ui.editor.graph;
const oldFactoryMethod = graph.popupMenuHandler.factoryMethod;

graph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
  oldFactoryMethod.apply(this, arguments);

  const cells = graph.getSelectionCells()
  if (cells.length > 0) {
    console.log(cells)
    const codec = new mxCodec();
    const encoded = codec.encode(cells);
    console.log("encoded:", encoded)

    console.log(menu)
    const submenu = menu.addItem("Send to", null);
    if (peers.length > 0) {
      peers.forEach(peer => {
        menu.addItem("Peer " + peer, null, function() {
          const serialized = new XMLSerializer().serializeToString(encoded);
          client.request("narrowcast", {dst: peer, msg: serialized}, (err, data) => {
            console.log("err", err, "data", data)
          })
        }, submenu);
      })
    } else {
      menu.addItem("No peers", null, null, submenu, null, false);
    }
  }
}

});