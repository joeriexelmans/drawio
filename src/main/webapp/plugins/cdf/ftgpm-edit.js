const styles = {
  "control_flow": "endArrow=classic;html=1;strokeWidth=2;",

  "data_flow": "endArrow=classic;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;",

  "detail": "endArrow=classic;html=1;dashed=1;strokeWidth=2;curved=1;fontColor=#000000;endFill=0;endSize=10;startSize=8;",

  "typed_by": "endArrow=blockThin;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;dashPattern=1 1;strokeColor=#666666;endFill=1;endSize=6;",

  "produce_consume": "endArrow=classic;html=1;",
};


function checkEdge(ui, edge) {

  function setStyle(style_type) {
    edge.setAttribute("pmRole", style_type)
    ui.editor.graph.setCellStyle(styles[style_type], [edge]);
    ui.editor.graph.view.clear(edge, true, false);
    ui.editor.graph.view.createState(edge);
    ui.editor.graph.view.revalidate();
  }

  sourceCell = edge.source;
  targetCell = edge.getTerminal();

  if (!sourceCell || !targetCell) {
    return;
  }

  sourceType = sourceCell.getAttribute("pmRole");
  targetType = targetCell.getAttribute("pmRole");

  function isActivity(type) {
    return type === "man_activity" || type === "autom_activity";
  }
  function isTransformation(type) {
    return type === "man_transformation" || type === "auto_transformation";
  }
  function isControlNode(type) {
    return isActivity(type) || type === "initial" || type === "final" || type === "fork_join" || type === "decision";
  }

  if (isControlNode(sourceType)) {
    if (isControlNode(targetType)) {
      setStyle("control_flow")
      return;
    }
  }

  if (isActivity(sourceType)) {
    if (isTransformation(targetType)) {
      setStyle("typed_by")
      return;
    }
    else if (targetType === "super_activity") {
      setStyle("detail")
      return;
    }
    else if (targetType === "artifact") {
      // console.log("PM data-flow (produce) link")
      setStyle("data_flow")
    }
  }

  if (sourceType === "artifact") {
    if (targetType === "formalism") {
      setStyle("typed_by")
      return;
    }
    else if (isActivity(targetType)) {
      // console.log("PM data-flow (consume) link")
      setStyle("data_flow")
      return;
    }
  }

  if (isTransformation(sourceType)) {
    if (targetType === "formalism") {
      // console.log("FTG produce link")
      setStyle("produce_consume")
      return;
    }
  }

  if (sourceType === "formalism") {
    if (isTransformation(targetType)) {
      // console.log("FTG consume link")
      setStyle("produce_consume")
      return;
    }
  }
}

Draw.loadPlugin(function(ui) {
  ui.editor.graph.model.addListener(mxEvent.CHANGE, (_, eventObj) => {
    eventObj.properties.edit.changes.forEach(change => {
      if (change.constructor.name === "mxTerminalChange") {
        const edge = change.cell;
        checkEdge(ui, edge);
        console.log(edge);
      }
    })
    // const {
    //   edge, // mxCell
    //   source, // bool: source or target changed
    //   terminal, // mxCell connected to, or undefined
    //   previous, // mxCell previously connected to, or undefined
    // } = eventObj.properties;
  });
})