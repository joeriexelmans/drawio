Draw.loadPlugin(function(ui) {
  console.log("Plugin 'logevents' will log the following events:")
  const events = Object.entries(mxEvent)
    .filter(([key,val]) => typeof val === 'string')
    .filter(([key,val]) => val !== mxEvent.FIRE_MOUSE_EVENT) // ignore mouse events (too many of them :)
    .map(([key,val]) => {console.log("  mxEvent."+key); return [key,val];})

  events.forEach(([key,val]) => {
    ui.editor.graph.addListener(val, (source, eventObj) => {
      console.log("mxEvent." + key, eventObj);
    })
  })
})
