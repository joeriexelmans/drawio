// Listen for updates of current set of peers
class Peers {

  constructor(client) {
    this.peers = []

    client.on('receivePush', (what, data) => {
      if (what === "peers") {
        this.peers = data.peers.filter(p => p !== client.uuid);
      }
    });

    client.on('disconnected', () => {
      this.peers = []
    });
  }
}