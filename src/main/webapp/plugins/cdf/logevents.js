Draw.loadPlugin(function(ui) {
  const events = Object.entries(mxEvent)
    .filter(([_, s]) => typeof s === 'string')
    .filter(([e, s]) => e !== 'FIRE_MOUSE_EVENT')

  events.forEach(event => {
    ui.editor.graph.addListener(event, (source, eventObj) => {
      console.log("EVENT: " + event, eventObj);
    })
  })
})
