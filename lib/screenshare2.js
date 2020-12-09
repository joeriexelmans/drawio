ScreenShare = (function() {

  function encode(cells) {
    const codec = new mxCodec();
    const encoded = codec.encode(cells);
    return mxUtils.getXml(encoded);
  };


  return class {

    constructor(client, graph, confirm, alert) {
      this.graph = graph;
      this.sharingWith = {};
      this.confirm = confirm;
      this.alert = alert;

      let listenerEnabled = true;

      const shareEvent = serializer => {
        // return new event listener for mxEventSource:
        return (source, eventObj) => {
          if (listenerEnabled) {
            const props = serializer(eventObj.properties);
            if (props !== undefined) {
              Object.keys(this.sharingWith).forEach(peer => {
                this.p2p.send(peer, "push_edit", {
                  event: eventObj.name,
                  props,
                }, (err, data) => {
                  if (err) {}
                  else {}
                });
              })
            }
          }
        };
      };


      // Our event listener, serializing and sending events to other peers
      this.graph.model.addListener(mxEvent.NOTIFY,
        shareEvent(({edit: {changes}}) => changes.map(change => encode(change))));

      // Handler for incoming requests from other peers
      this.p2p = new PeerToPeer(client, {
        // incoming request from another peer
        "push_edit": (from, {event, props}, reply) => {
          if (this.sharingWith[from]) {
            // temporary disable our listener, we don't want to echo our received edit
            listenerEnabled = false;
            ({
              [mxEvent.NOTIFY]: encodedChanges => {
                const codec = new mxCodec();
                codec.lookup = id => this.graph.model.cells[id];
                const changes = encodedChanges.map(encoded => {
                  const parsedXml = mxUtils.parseXml(encoded).documentElement;
                  const change = codec.decode(parsedXml);
                  change.model = this.graph.model;
                  return change
                });
                console.log(changes);
                changes.forEach(change => this.graph.model.execute(change));
              },
            }[event])(props);
            listenerEnabled = true;
            reply(); // acknowledge
          }
        },
        "init_screenshare": (from, graphSerialized, reply) => {
          const yes = () => {
            const doc = mxUtils.parseXml(graphSerialized);
            const codec = new mxCodec(doc);
            codec.decode(doc.documentElement, graph.model);
            this.sharingWith[from] = true;
            reply(); // acknowledge
            this.alert("You are now <b>screen sharing</b> with " + shortUUID(from));
          };
          const no = () => {
            reply("denied")
          };
          this.confirm(`Peer ${shortUUID(from)} wants to <b>screen share</b>.<br />Your diagram will be erased and replaced by his/hers.<br /><br />Accept?`, yes, no);
        },
      });
    }

    initshare(peer) {
      const graphSerialized = encode(this.graph.model);
      this.p2p.send(peer, "init_screenshare", graphSerialized, (err, data) => {
        if (err) {
          this.alert(err)
        }
        else {
          this.alert("Accepted: You are now <b>screen sharing</b> with " + shortUUID(peer));
          this.sharingWith[peer] = true;
        }
      });
    }
  }
})();
