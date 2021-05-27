// This plugin defines a new type of shape called 'svg-viewport'. It renders a nested <svg> element at the position where otherwise a shape is drawn. By adding children nodes to the SVG element, the SVG element essentially serves as a viewport to a customly rendered scene.
// To test, create a vertex, and add to the style: "shape=svg-viewport"
Draw.loadPlugin(async function(ui) {
  const svgNS = "http://www.w3.org/2000/svg";
  const customHandlers = [];

  // map cell id to SVG element
  class SVGViewportShape extends mxRectangleShape
  {
    constructor(bounds, fill, stroke, strokewidth) {
      console.log("SVGViewportShape constructor");

      super(bounds, fill, stroke, strokewidth);
      this.svg = document.createElementNS(svgNS, "svg");

      // For demo purposes, we draw a scene of shapes in our <svg>, onto which our mxGraph shape is a viewport.
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", 100);
      rect.setAttribute("height", 100);
      rect.setAttribute("rx", 15);
      rect.setAttribute("rx", 15);
      rect.setAttribute("fill", "blue");
      this.svg.appendChild(rect);

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("r", 50);
      circle.setAttribute("cx", 100);
      circle.setAttribute("cy", 100);
      circle.setAttribute("fill", "green");
      this.svg.appendChild(circle);

      const triangle = document.createElementNS(svgNS, "polygon");
      triangle.setAttribute("points", "0,0 100,50 0,100")
      triangle.setAttribute("fill", "red");
      triangle.setAttribute("transform", "translate(20,80)");
      const g = document.createElementNS(svgNS, "g");
      g.appendChild(triangle);
      this.svg.appendChild(g)

      // Workaround: wrap <svg> in a <g> for rotation.
      // The <svg> element itself does have a 'transform' attribute in SVG 2, but is not yet supported by Chrome.
      this.g = document.createElementNS(svgNS, "g");
      this.g.appendChild(this.svg);

      const dragHandler = (mouseDownElement, moveElement) => {
        // Could this as a statechart :)
        let posX = 0;
        let posY = 0;
        let dragging = false;
        let dragStartX;
        let dragStartY;

        return (evtName, me) => {
          if (dragging) {
            const dX = (me.evt.screenX - dragStartX) / this.canvas.state.scale;
            const dY = (me.evt.screenY - dragStartY) / this.canvas.state.scale;
            // Convert to radians and negate (rotate movement vector in direction opposite to shape rotation)
            const a = -this.canvas.state.rotation * Math.PI/180;
            const rotatedX = dX * Math.cos(a) - dY * Math.sin(a);
            const rotatedY = dX * Math.sin(a) + dY * Math.cos(a);
            if (evtName === "mouseMove") {
                moveElement.setAttribute("transform",
                  `translate(${posX + rotatedX}, ${posY + rotatedY})`);
                me.consume();
            } else if (evtName === "mouseUp") {
                dragging = false;
                posX += rotatedX;
                posY += rotatedY;
                me.consume();
            }
          } else {
            if (evtName === "mouseDown" && me.evt.button === 0) {
              if (me.evt.target === mouseDownElement) {
                dragStartX = me.evt.screenX;
                dragStartY = me.evt.screenY;
                dragging = true;
                me.consume();
              }
            }
          }
        }
      }

      customHandlers.push(dragHandler(rect, rect));
      customHandlers.push(dragHandler(circle, circle));
      customHandlers.push(dragHandler(triangle, g));
    }

    // Override
    paintVertexShape(canvas, x, y, w, h) {
      // console.log("paintVertexShape", "x:", x, "y:", y, "w:", w, "h:", h);
      // console.log("paint", "pointerEventsValue:", canvas.pointerEventsValue, "styleEnabled:", canvas.styleEnabled)
      // console.log("paint", "pointerEvents:", this.pointerEvents, "svgPointerEvents:", this.svgPointerEvents);

      // Draw rectangle (so our viewport has a border and a (e.g. white) background)
      super.paintVertexShape(canvas, x, y, w, h);

      if (this.svgPointerEvents === "stroke") {
        // WORKAROUND: When a connection point on a shape is hovered, or another shape is being dragged into the shape, a new instance of this class is created and invisibly rendered with a slightly larger bounding box, perhaps in order to capture more pointer events. This is very strange behavior. Anyway, we do not want to re-create the inner SVG scene.
        return;
      }

      // Set viewport size to match cell size
      this.svg.setAttribute("width", w);
      this.svg.setAttribute("height", h);

      // Set viewport position, rotation and scale (zoom) 
      this.g.setAttribute("transform", `scale(${canvas.state.scale},${canvas.state.scale}) rotate(${canvas.state.rotation},${x+w/2},${y+h/2}) translate(${x + canvas.state.dx}, ${y + canvas.state.dy})`);

      canvas.root.appendChild(this.g);

      this.canvas = canvas; // we need this later on
    }
  };

  mxCellRenderer.registerShape('svg-viewport', SVGViewportShape);

  // HACK: We don't register our customHandlers in the 'mxGraph' way (mxGraph.addMouseListener or mxGraph.addListener), because then our handlers are called AFTER mxGraph's internal handlers are called. So instead, we override mxGraph.fireMousEvent to allow our own handlers to be called FIRST, possibly consuming the 'me' object.
  const fireMouseEvent = ui.editor.graph.fireMouseEvent;
  ui.editor.graph.fireMouseEvent = function(evtName, me, sender) {
    for (const handler of customHandlers) {
      handler(evtName, me); // possibly consumes the 'me'
    }
    fireMouseEvent.apply(this, arguments);
  }
})