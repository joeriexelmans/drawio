// This plugin defines a new type of shape called 'svg-viewport'. It renders a nested <svg> element at the position where otherwise a shape is drawn. By adding children nodes to the SVG element, the SVG element essentially serves as a viewport to a customly rendered scene.
// To test, create a vertex, and add to the style: "shape=svg-viewport"
Draw.loadPlugin(async function(ui) {
  const svgNS = "http://www.w3.org/2000/svg";

  // map cell id to SVG element
  class SVGViewportShape extends mxRectangleShape
  {
    constructor(bounds, fill, stroke, strokewidth) {
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
      this.svg.appendChild(triangle)

      // Workaround: wrap <svg> in a <g> for rotation.
      // The <svg> element itself does have a 'transform' attribute in SVG 2, but is not yet supported by Chrome.
      this.g = document.createElementNS(svgNS, "g");
      this.g.appendChild(this.svg);
    }

    // Override
    paintVertexShape(canvas, x, y, w, h) {
      super.paintVertexShape(canvas, x, y, w, h);

      console.log("paintVertexShape", "x:", x, "y:", y, "w:", w, "h:", h);
      this.svg.setAttribute("x", x);
      this.svg.setAttribute("y", y);
      this.svg.setAttribute("y", y);
      this.svg.setAttribute("width", w);
      this.svg.setAttribute("height", h);
      this.g.setAttribute("transform", `rotate(${canvas.state.rotation},${x+w/2},${y+h/2})`);
      canvas.root.appendChild(this.g);
    }
  };

  mxCellRenderer.registerShape('svg-viewport', SVGViewportShape);
})