Draw.loadPlugin(function(ui) {
  const graph = ui.editor.graph;

  // console.log("Plugin 'logevents' will log the following events:")
  // const events = Object.entries(mxEvent)
  //   .filter(([key,val]) => typeof val === 'string') // only 'string' entries of mxEvent are events
  //   // .filter(([key,val]) => val !== mxEvent.FIRE_MOUSE_EVENT) // ignore mouse events (too many of them :)
  //   // .map(([key,val]) => {console.log("  mxEvent."+key); return [key,val];})

  const new_handler = (label) => {
    return (source, eventObj) => {
      if (eventObj.name == mxEvent.FIRE_MOUSE_EVENT)
        return; // only print consumed mouse events - otherwise there are too many!

      console.log(label + " emit ", eventObj);
    };
  }

  // ui.editor.graph.model.addListener(null, new_handler("mxGraphModel"));
  // ui.editor.graph.addListener(null, new_handler("mxGraph"));


  // const oldStart = graph.graphHandler.start;
  // graph.graphHandler.start = function(cell, x, y, cells) {
  //   console.log("mxGraphHandler.start", cell, x, y, cells);
  //   oldStart.apply(this, arguments);
  // }

  // const oldReset = graph.graphHandler.reset;
  // graph.graphHandler.reset = function() {
  //   console.log("mxGraphHandler.reset")
  //   oldReset.apply(this, arguments);
  // }

  // const oldUpdateLivePreview = graph.graphHandler.updateLivePreview;
  // graph.graphHandler.updateLivePreview = function(dx, dy) {
  //   console.log("mxGraphHandler.updateLivePreview", dx, dy)
  //   oldUpdateLivePreview.apply(this, arguments)
  // }
})
