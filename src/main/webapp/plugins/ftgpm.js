Draw.loadPlugin(function(ui) {

  // Programmatically create CSS classes for toolbar buttons
  // (such that everything is contained in this single source file)
  const style = document.createElement('style');
  style.type='text/css';
  style.innerHTML=`
    .geSprite-editMode{
      background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAABHNCSVQICAgIfAhkiAAAAdVJREFUOBG1k7tKXUEUhrVRrCwEJRZiESsvjVECdvY2NkIaQcRGbXwAH0IEGz0garAQLGx8Ci8hhGilYIo8gB45ld83zhy2c/bGA+KCb8/sNWv+WWsuHR2vNkKTGKU/EP1504NjEoYifbTSYoo9Qh2eYntGmwsruA4NuIXfsA/bMAVvxP05jEzHgFnaLiiaosvwD9ZgEXbAuSZ1DF8gmKK7EfudkAviCjbO12rcom4wXubgP6yA/uBU9Ai+gdtRZY4pmscobKZmbj98FLyHO7CUfBKuYEnUTIumkPv7RrSG4xxMfwyqzFP/C/MQyoyBX2k9uB/J7yqWr/BgdOoLZdAWTdE/sABJdJj+ElyD4sFS6j/5mwFXswyvSi6cMl1lzC3wDE7hCr5D09Lqz3g8BDNJ9y8XTXtqXIq1ygloMYVd2Un2FcsFcQUzRoz3KjXvJv0PmfspCqYEmvtZpdzLgBTNyT5HM/SgNsC9t/wDuIRKYcU2I0lYwT1oQB0eYntC25ZoP4HeBLGfrJipWd6AB9RW+QbVIvZz07cFR1A2nseHfwMtScomeUC+vF/gTWnL3hN13APyLpctWrrIp4n6RMueqVlYvk/5Atoun9jmidovM4UrBV8AZpNaQa3HI20AAAAASUVORK5CYII=')
    }

    .geSprite-execMode{
      background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAABHNCSVQICAgIfAhkiAAAAg5JREFUOBGFk79LXEEQx02TdGksQlJYKRgMqTxBUgTUwiZNGkEI6ZIiTf4QIY0ggoYLeAnYiQgSEdIHAvlBjJVam1JjSj+fdzv6bvfdOfC5nZ237/tmZueGhro2xhJM4N9L8XwxfjsPNu0VO4cL+JfWbdZc2L3xFxDCo/jDUJjBjcQUawtmIF7Erewhv4fwAyYTX1mXoRA2sJbQvwW5IKHKpvn17GZC32wLC9EOT8zAdgyyWR6ewl+Y73dQUQVP4Bjsbz/hOzx7DJ/gD7wGY4Up+h524RU8gibz5UX4Bgo/BROYg8KifIUfgC8bk7rdZ2MPV8Fn9vIXfE8+y7V54AN8hCdgNitQv1U/9AwiS9zq41Z2AMVljRD8Df/BOdX3I3VRtpWIZ+ummJn6waK3Hvaf5AXpN5VPuMc8o5DCd3ueZBtFg0HCPnsHL2EBnkORKbFKLP6uruuwBArkZna2yIuyXbYgbw2h7ssbrNJK+yZBp8AJsOeOlmKNgsSrjByZNjirUX79BUt0Ovz/K3ijKdKGL7AHbbBExyiEPeO4GW+qgnCvecjS9yFEFTCzuIRBol5wYWZj49/COHgZAW5lijvwlh/ZG/NPcwaFsIcOYQfeQJSZl+8odWAS/KhjtQVOQXwIt2uR6We2P8G+5eV70guyoiM4SL4X3PfiFHZkXO2fRD9xr8wMF8Ch1/fclV0CPbJjuyrb75oAAAAASUVORK5CYII=')
    }
  `;
  document.getElementsByTagName('head')[0].appendChild(style);

  const ballRed = new mxImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAl5JREFUSA3tlN9rUmEYx89FEO1mwS4qYu3oNMZsNkg3nS5damyno05oU6ZCc22E9GtddNl998H+gG5iUEEX/Q9dVGsJrfajFhQ5ElqdTO14vnsedcMk6CxvFb6cI+rn87zf97wKQuvVagDC8Y5KvDMm9EgnIRiGIYgOCKaDTbVTBRusaLctwJF4ilD6I4aSWbRZiyQpUe7/twRCt4kAD9DpX4N8ZQVTN1UKMHkdOBHQ6DMOIBgfUcz7Wkll8nb7IvoubiNytYjELVQSZ8G1MrrOfyX4r6qAJbwak0W3BJaQCZ5LW4jPq2BoYr6a0TnAFgNVxNCGiHd01wV3MojojSqUBXESRKkaw2gjvEwiDsveQeg6pmsV8Kb81LWGKZI4E4Alwr0z5AdFrQH5Pe/DNqUmMab1CQTRQ9NqcMQbJ2Yow2obXJm8oB0w5wtHXHl0nlvk/funhABWivL3rv/snuCFXM+YmnEEywVpdgN0VnQIjGYSFCj8rPPUu3Xs3u9dFUOgtHp2QnvlCiMfnP2sU8AnV3xI4E+U+jr2wCxVjrqKywOytjQUwpdgCuWR6bu6nqTaCb5HB+gxZYFglZWoh06BKgFdy4roVzN2Gc8HJaz5Yih5p1/ofoq4QwLbCfyTskpRiofPaBunJWz1StqHfll77QzhpVMGT785EsVvMfBE1wbXbxD/BVAuqG19OYKrPO2SQ0aGoMvuMN57JzUlPKcUh5O39w1vENmy3b7xN4OhlXVfLJ9xj39/65nI5ryJy5DS/fXfber+2UCk45uUsq0HYrbNsXhvU7DWj+sb2AHe0Kt+469BPQAAAABJRU5ErkJggg==', 24, 24)

  const ballGreen = new mxImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAmlJREFUSA3tk81PE1EUxWdBYmSjCQt1oUIshtCILAq0tdgSNJFq/dgAMx1sYitRaquo0IlEgx8N0Y0YUf4AN4ZETVz4P7hQEZuIfCkmGktsIjrWtk7f8b6xIbVpwmC3neTkzWRmfue+c+8ThPJVTkDA8SouF4ZNdQjuFCC3CvBaBXSsKy0dHSw2bIBv3IqLzw5j5KMdg/FKyGkBUoZMHvy/CWQTQR5uhX/uEKLTEu5qJHTiNrbBz+gdFwSIj2mtXdtOqHKqemIXQsvHcCst4x64vKROjGa3I/CVoL/+GnATvhvRbNjEjD6TE5eWvBjTOFTGfV0HcA0WnAdFxKEFEq8YjsuBiKcLozqUG5ARunAHNThZCM+SERc3m6HmbzG0CxeUfZQ1kwhswwDMCPLcOeQHScsB+TPvwzIpZyL2GTKgPJ1ULbMSvEgcHJZrsF55qoJ5k5tSviQNxIQ+0qu6QGwgiFoEXpC7hAomp+oSvZo1Fs66U1cX+FlZlU/wWlKKRNOx0sz8qleMalR/Zu/sBbbn9Vl4ktHPBg34yZUekT6RioK58WbVl26eCjL7ZBieL9fRlr1809gk6SdYGiPIE9I4Sd/Jehpayhu0ZqvVE1pTLIiWF2fQPqfAlRl6aXiK9AzhbSLwT9IsSd2Y7mG7F06hfqmXNX44zWxvwrC9CoNX37aooPp34KmxBud3SO9F98FKrSdBcI1Xa50MwR47B8dUP1zvI+yIOqK2piODa4f/Y9Rt2RH3H215G5pun1eSjlj/d+e7gbgroQTciDbmf1rSffPzYJX72w3L/vkhS8ficH1JsPLP+Qn8AdLJz6rYlHDiAAAAAElFTkSuQmCC', 24, 24)


  // Editor "mode"
  const modes = Object.freeze({"EDIT": 0, "EXEC": 1})
  ui.editor.ftgpm_mode = modes.EDIT; // initial mode

  const createOverlays = function() {
    for (const id in graph.model.cells) {
      const cell = graph.model.cells[id];
      if (cell.getAttribute("pmRole") === "man_activity") {
        let img;
        if (cell.getAttribute("pmActive") === "1") {
          img = ballGreen;
        } else {
          img = ballRed;
        }
        const overlay = new mxCellOverlay(img, null, mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_TOP, null, 'default');
        graph.addCellOverlay(cell, overlay);
      }
    }
  };

  const removeOverlays = function() {
    for (const id in graph.model.cells) {
      const cell = graph.model.cells[id];
      graph.removeCellOverlays(cell);
    }
  }

  // Add toolbar buttons
  ui.toolbar.addSeparator();

  const to_edit = ui.toolbar.addButton("geSprite-editMode", "Enter edit-mode", function() {
    ui.editor.ftgpm_mode = modes.EDIT;
    to_edit.setEnabled(false);
    to_exec.setEnabled(true);
    removeOverlays();
  });
  ui.toolbar.addEnabledState(to_edit);
  to_edit.setEnabled(false);

  const to_exec = ui.toolbar.addButton("geSprite-execMode", "Enter exec-mode", function() {
    ui.editor.ftgpm_mode = modes.EXEC;
    to_exec.setEnabled(false);
    to_edit.setEnabled(true);
    createOverlays();
  });
  ui.toolbar.addEnabledState(to_exec);

  // Override context menu handler
  const graph = ui.editor.graph;
  const oldFactoryMethod = graph.popupMenuHandler.factoryMethod;

  graph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
    if (ui.editor.ftgpm_mode === modes.EXEC) {
      if (cell && cell.vertex && cell.getAttribute("pmRole") === "man_activity") {
        const wasActive = cell.getAttribute("pmActive") === "1"
        menu.addItem("Active", wasActive ? Editor.checkmarkImage : null, function(evt) {
          cell.setAttribute("pmActive", wasActive ? "0" : "1"); // toggle
          graph.removeCellOverlays(cell);
          graph.addCellOverlay(cell, new mxCellOverlay(wasActive ? ballRed : ballGreen, null, mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_TOP, null, 'default'));
        });
      }
    }
    else {
      oldFactoryMethod.apply(this, arguments);
    }
  }


  // Draw overlay on all cells where 'pmActive' attribute is set
  // 'SIZE' event as demonstrated by 'tooltips' example plugin ... not sure why this event, though
  // graph.addListener(mxEvent.SIZE, refreshOverlays)
});
