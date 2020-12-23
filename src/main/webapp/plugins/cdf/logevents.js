Draw.loadPlugin(function(ui) {
  const graph = ui.editor.graph;

  const new_handler = (label) => {
    return (source, eventObj) => {
      if (eventObj.name == mxEvent.FIRE_MOUSE_EVENT)
        return;

      console.log(label + " emit ", eventObj);
    };
  }

  // ui.editor.graph.model.addListener(null, new_handler("mxGraphModel"));
  // ui.editor.graph.selectionModel.addListener(null, new_handler("mxSelectionModel"));

  const loggers = {}

  window.ui = ui;

  window.logEvents = (eventSource, name, event) => {
    logger = new_handler(name);
    eventSource.addListener(event, logger);
    loggers[name] = logger
  };

  window.unlogEvents = (eventSource, name) => {
    eventSource.removeListener(loggers[name]);
  };
})
