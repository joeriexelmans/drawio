Draw.loadPlugin(function(ui) {
  const primitivesLib = '<mxlibrary>[{"xml":"dVPRjqowEP0aknvfgMqijwKKq7KyatTlrUCXFgpl2yro129BvavJXRKSmXPOMJOZgwbcsvU5rHHAUkQ1MNGAyxmT16hsXUSpZuok1YCnmaauXs2c/sIaPavXkKNK/qeAxTlKpFJQGHfNvJ7sS8o1o+iKkIpIAumVuH+61z13FfJ8LxEY1l0oJKoSQv/ku6X0WJB5swaq7vnbIBM7aWum4zd5Eble7DFQWcPVIjiuceCGh69Rga1gR+1DuPWctygAc7GZDm08C/22sQ/yne3O5moy3/LKaIzAH2+jbKL7deNP53uAS9VmXVgwOY/5Oo38xWbLd9a7Ql/xKgzRizuC7W4ElroUJjYzy3jf83kTzz4ukyifOvQ8iT4u+WA8Px9GOTFAuHidtGZ4Khoj0+vTMnRLfWQealNQ+pKeZvLoxmG8T76CJK+HajgrE2oDfzXgNJhItKlh0q2kUcdVGJZlt3BDhVDU3RWA90lapNbrqO2lrFGArpKMQiFucX8mByZFxtmxSl1GGVdUxSrUlUnOCrQnqcQKVNdxPgmld5FmgpHt6bbd4aySG3LpxjEGt/xBp/dPNxklWaWwRNkHKdLhSJALjPszdwLOJJQP+dUjJ8Qlan+1oPFgHR+xEkl+VpLmNrhiwdWlOkYkw/IZg+KaZ/8qf/ysgpsb7+nN4ff050/qpU8/2jc=","w":30,"h":30,"aspect":"fixed","title":"PM: Initial"},{"xml":"dVNrc6IwFP01zOx+A2LX8lEe1kfVWqzWfgsQSTAPNkRBf30vqFs7s2UmM/eec08Scs+1UCCaJ41LOlMZ4RaKLBRopcwlEk1AOLdcm2UWCi3XtWFZ7vAH1ulYu8SaSPMfgUoKkhqo4DhpDws7spOIV8XJBdkxifkFvm3cVX0/szKnm6CiuGzDyhCZMv7LrF9MqMb5cGRjOJstKi8xH8dtSh8m9mw0D2xTe75wiwV6KosUthguwuMuDXqFMEzhImeHKLSLZTGdAUf6XnbYvpvDaNbgYFCUaZNM0Ot8Y7k+zQYz/+9YJenI3bzTAUDk7QQilCdzsU6mb73hZq6iKh/T1OkPVs7Uyb0MKXpSyF3jPHoIl1SAbFWQXEkhymIJ8mh2XvrRVo+aI+8fgY7i8WItJ2wUPbPtYbKKXenu3xfbj0CqPZJQ4T2CrjhOC4F6NIu91dqMz8s/E8dEWeM/rHS6g4J4iV4S8taQeLHvPT4+i9cUXu63hfyaMkPiEqftU9ZgCcCoEW2bHAhxVba9Q+GONQTa4sOrZ6oGwIYk57iqrnHXXB+n+1yrg8wCxZUGSipJWpnRak82LDMUQOiqv2Oc34osF3n90O73W1xJE7Nzex2nd83v6uzua2/GWS4BS8F0RHcAV/VAa1VX18trZbDBSWeYVqJJxc53OcnYPX0x35FoQ5ofne3cefKJKEGMhsbb9fXPgEUX89uUsJya7xiuLnn+T/k1JhBcbX5Lr4NzS78GtCv9Nr+f","w":30,"h":30,"aspect":"fixed","title":"PM: Final"},{"xml":"dVNNb4MwDP01uU4QBNqu0K6XTZPaSTtOAVzIGhIWQkv36+eEUGi38iHwe7YTPzskyppho1lbv6oSBInWJMq0Umb8a4YMhCA04CWJVoTSAF9Cn++woWODlmmQ5p8AlX9BYdBDsNwutnJkItA33StpmUIJpR2TfPd2GymhUeCuJZRU/uti+S2QT0DDZM/EBdYTzgrDj9ycJwa3mN8mQexPYsTGjU6wq7fZKgFjObjg55ycLsSh1rzWrTPnKU6rXpZgXUPMe6q5gV3LCsuesD2I1aYRnu6MVgf44KWpEaFevewiXbR3F+IF4oxL0D4S5RWs7Xju1g0QKbVq35muwHgXposd/7H0I1qt4tJ0Nmuc4oNNyIKHmMS4SoZ2ONv4RKlUL761NreGotcdP8IWujGlRWFomSy9sedCLDa+TuxtW8WKQ+VEeeuNwAq8PxYkcYbYXMCo8hG0geHuGIYL8TegGjAa2xOcvIS2PU/xGFYDr+opzM9vwLoRqC6x81Tjj+/oZPo5n8z5PDnXq+P2Cw==","w":295,"h":120,"aspect":"fixed","title":"PM: Manual activity"},{"xml":"dVPJboMwEP0aXysWJWqukOXSqlJSqcfKwATcGEzNkJB+fcfGLEkbBIJ5bxbPm4GFcdntNK+LV5WBZOGGhbFWCvuvsotBShZ4ImPhmgWBRw8Ltg9Y37JezTVU+E+ASr4gRfKQPDHF1pZcSvKNjqoyTKqk0pZZfrfmGBELQs9ec2iZu7eNFfdAMgC8RVVyhGxk9EilKM4CrwNDp0zu8xD2Jzdh/VkH2LZc7pWEviNb83NKH8wUCox5K16D1yFSq7bKwLj6lPlSCIRDzVPDXmhGhBVYSkc3qNUJPkSGBSGBkzAe9QuP9iI8JZyLCrSLJI0lrxuR2LoeIZlW9TvXOaBz4To9iB9DP5NVK1FhY7IuIrppErH3tGALqhKT7U823WFUqRc3X5P7KKScnWq7jTcr2odIQ9rqRpxhD01fynhDV/Mqc0bC01NuRXlrUVIHDqeGKlokPjXQq3wGjdA93EV/Jv4OVAmoaTzexUloxrNa9GEFiLwYwtwSe7zpgXyMnVabPtxEB9Mt+2BOP5V1vfnnfgE=","w":295,"h":120,"aspect":"fixed","title":"PM: Automated activity"},{"xml":"dVNLb5wwEP41vkY8Su+F3c2llaI098gLE3BkPNYwDZv8+oyNd4EqkYyYb95PVTbj5Z60H/5gB1aVR1U2hMgLNV4asFYVmelUeVBFkcmnitM30jxKM68JHH9hgOdXaFk0rD6HYIco/GlFtz4L0QdC/nr0QtivUNYyxZBOBd9JuDe8omRy2rpeYtHKqTqYWjKeDYrLKlVgdQsD2g5o2pc2PqKFhRUyeTbOI/Ei3HpKtRWb7kS4b9zE71dvhP9cB0E1k7zmwTD89ZKFMGaZj/AGHkPPciEJJvOhz9E24I7QP2nqgROjRcfaOKAbtlb7ySwmIQK+Ab1YnAW+mSSoHf5OkwkqobIG3cQkrvgRWafSohDIjMAxAslUtestPKzMenLaP+EDmrgKwUQk+tiZNcfRtLdQohZbXdXyZLJNdlepSjrTBCy0cP7D+Q3nq768stZWKvtFhPOUAtA+e5A0Nv17MdY2aJHiLMrDj2N+quJ6hAFKpxgu3654vpnrPaBUSe+iMpuOh6SRLWeQDWD6IZmViafThvU30/VghEi7coXphK5wPdWourvkTw==","w":100,"h":30,"aspect":"fixed","title":"PM: Control flow input port"},{"xml":"dVNZb5wwEP41vFYcJe+B3c1LI0WbvFdemICrwWMN3rDpr+/YeDmqRDJivrnPpKiH2xMr2z9TC5gUx6SomcjN1HCrATHJU90mxSHJ81S+JD99I82CNLWKwbgvDOjyBxonGqguPtghCB9QdKuLEJ0n5K8GKwR+hdLGsQ9JV+9nke4t7yjanLa+52C8csoWxoa1dZqMoFgCqgZ6whZ43Nc2nAlhZvlUfksiltjN0q2rWF2+6U+A+9aN7vPujulqWvCqqSQ29drBq5U0hDHJhITXu8F3LROSYdR/1SXYetwy2TfFHbjIaMg4pQ3wghGVHfVs4iPQB/A70iTwQ0dBZehXnI1X8ZXVZEbH4sqdyalYWhAC6wFciMAyV2U6hJeVWY1G2Td6IR2WwZuIRB1bveY46GYJJWqh12UlT0Zbpz/KpJTO1B4LLZz/cLbgbNWXV1QKpbJHZprGGID32YOksenfu0asCYnDLIrDz2N2KsN++AFKpxzcvl3ybDPXJyCpkj9FZdKt66NGOh9C2oPu+mhWRJ6KK9YtpuvJCBF35Q7jEd3heqxBdXfL/wA=","w":100,"h":30,"aspect":"fixed","title":"PM: Control flow output port"},{"xml":"dVNNb6NADP01XFd8iL0X2vSyK1Vt7pUDDkw1jJHxlmR//XqGIYRVGxHh9+xnz9g4Kerh8sww9r+pRZsUT0lRM5Es1nCp0dokT02bFI9Jnqf6T/LDN94seNMRGJ18IaDTBzaiERZOvthjcP60Glud1Oi8oW8YRjXsVyhtQcCXdInPHZ174Yqi5HCfeqnFG1M6GFBfPl3xEJKWch0XKtzGQoM92RZ52l0zCAOxpPBcUAbuGHKEBMMr2cgCizlDI+/GjcSyBKztyz3cd3aS6ypl+uNa9KF60GrujeDbqEdTYtYBKtfL4Juaqck4mb9wClqPW6bxCNyhRKIhJ2Ac8g1bC+NkFomvQJ/IZ0uzwk8THZWjX3F0PsRfoSY3CWsqeSUBMeRWJ7IZUEIF1rGD6yy+bGQ1ORiP9EImfCteoh54as12xsE0t1IaFvpfVvrolOr0R5mU2pnaY7WV+Q9nN5xt8foUFVi92QMzzVMswPvTn421NVni0PziEH7Kox7vrq/LALVTgpdvdyC7m+szkt6Srxoym1b6GJEue5L2aLo+yorIQfzsupt02yg14reywrhjK9x2OYTuVv0f","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact input port"},{"xml":"dVPbbpxADP0aXisuou+BZPPSSlG675UXvDDVMEbGCbv9+nqGAUKVrFiNfexjjy+TFPVwe2YY+5/Uok2Kp6SomUgWabjVaG2Sp6ZNisckz1P9J/npC2sWrOkIjE4+IdDlDzaiHhYuPtljMH636ltdVOi8oCcMowr2My1tQUAPevNxNuuRuWqRc/oYe0nGO1I6GFAPH654CEFLuY8LFMqx0GBPtkWeDnUGYgCWEB4LzICdQ4wQYHglG1FgMVdo5LcWMBLL4rE2MPfqsbeT3Fcu05tr0bvqTau5N4K/Rr2bArOOULFeBt/WTEXGyfyFS+B6vWUaz8AdSgQacgLGIW+6tTBOZqH4DPSOfLU0q/puoqFy9CMOz7v4Empyk7CGklcSEENuNSKbASVkYB08uM7iyw5Wk4PxTC9kwrZ4ilrgqTX7HQfTbKnULQygrPTTMdXptzIptTO111VW5D892/Rs99evqMBqZQ/MNE8xAR9vfzXW1mSJQ/OLU/iFjfET09YI3r5c++zDIJ+RtCy+q8tsWumjR7o8jbRH0/WRVkQM4qJ1G3V/RCrE5VjV+KxWdX++wfXwuv8B","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact output port"},{"xml":"dVLBbsMgDP0ajq0g0CTXJVt72mU97EwTN7CSUBG2tH8/Q8jaSisSkv387GdsCK/7y87Js3q3LRjC3wivnbV+tvpLDcaQjOqW8FeSZRQvybZPoixG6Vk6GPw/CfbwBY1HhpGHIBYIL87rowxoTO0/rIE5Ih8ii0YW3Ef50V+XHGe/hxYClRJeTUp72J9lE6ITvhIx5fugzNAclWztlLidkeOY7NE7e4JP3XqFCMpVR21MbY11UYZv4wm4HfwdTuNBXBrdDYg1OAhwibhPfQr04wQq2Zy62PJSY7ADMqrG9rpJzczP/wHn4fJ0zOxuKjuwPXh3RUpKWIn1RhSi4BtalrnIBYMV43OVayqwZjwv85IXRcZyllN+o0xpEIFG54VSBbpTSVwkTI6z3/01cFs9Gmlfi5s+w+LePl2kPvzJXw==","w":100,"h":40,"aspect":"fixed","title":"PM: Artifact"},{"xml":"dVPbbqMwEP0apN03A7nxyCUhaci9hG5eVgac2MTYxLgJ4etrINlupRYJaebMDB7OOdZMN698AQu84CmimjnWTFdwLrsor1xEqWYAkmqmpxkGUK9mTH6o6m0VFFAgJr8Z4HGGEqk6KIybw7y22I7kW05Rhxy5OP/NOGFd6fnxtvPruaW8P4dKDIsmLCViCaG/6D6IvXJ28tYGvJL12KnUFkt9bdmYDxbAftsM0lGQusO6PN9ebWIy62WX2JfZPEM3kCyhbdhTNh/FO3YNNMMJDgiDu9j19/vBrGdF42pOKj02Cz7wMPOXFjnk+9XdibcLJurxhoYBOxeFM9F7fApeT7hm73gahZdMH14DPAgjw18RPwUrScvDRIrJngOIwjqfOcnCR/Uler/es37sWmxZzf7Ad7VEKGL1F+vD2hmOFNdOpjJ/B423l+Uoqv3zdhPm0/5ms+0pJn5rpnPDRKJdAZOGmpuSWWFY5g31ugpLKfgZRSSVWCGKXedIKHU55aJl1QTt0+Ccye9wSMmJKSxRgiPRAGXRSGx6R1IhpZzTiXhFQqLqR5fo/2nrI54jKe6q5fbYTFWtzkgAI3LCj6mHuQAsu/z0b/LTcip42OWZPkz4TD/N3rZ+uQsf","w":90,"h":20,"aspect":"fixed","title":"PM: Control flow fork/join"},{"xml":"dVLbbqMwEP0apN03wG3CPhYCKWlCmoaEwktlwOFmMGs73L5+TUi2jdQKIZ0zPjMezxwJGGW3pLBONyRGWAKmBAxKCJ9Q2RkIY0mVs1gCC0lVZfFLqvXDqXI5lWtIUcW/SSBhjiIuFBiG42WjYAOrMxyLuBRW7ERoCXlGqmul8o1gNAlLWH3wbzS3y9WR3vfFeH/LZimsR8g4qqIM/8oDK1wwOzHN43s7iA4NoxiOJ+9pjg/FyrH1GoSy9rcsOl13jMfK6tN5sQN5UQeZsdkzu0nXplsjcyup+nFdtAzsBFLaKPIPKX5UQUBsS59rK7IKEjmKzk23mi2KVgMPOmhic7Z/eX6bk4WW2G4Mz/32LIau6gjng2I6LvXXZ+JYPrT5H2g9vQTdKfZEm699qaBmp/gzzyXxcxO+Mn15hNypB4149iEXRaytV2utL177WwJ6m2Yc7WsYjc9vxapFLOXlOH5FQIpYNsDwMid55IRD/oWfMowNggm9zBGYs/ET8Wn4DaIcdT9uX/mykyUiJeK0F5I2i3k6KR4mg8gpypKU38cgm3jyP/PTSgJc13yjV3Pd6KeJL9I7j/8D","w":40,"h":40,"aspect":"fixed","title":"FTG: Manual Transformation"},{"xml":"dVJdc6IwFP01zOy+AWmVPgqCxVqsFWXlZSdAJEAgLAmfv75BdFtn2gdmzrk5N9zccyRg5N2qgiV+pREiEjAlYFSU8gnlnYEIkVQ5iSSwlFRVFp+kWj+cKpdTuYQVKvg3DTRIUciFgsBg/NkoWNSc5pCjSJTdChbsTCvBE1pcL8vfKUGTFgrtX/6N6DaAOtL72Rjvb+0Mw3KEjKMiTMiv1LeCJbNj0zz+aQcxpWFkw/HsLebkkK0dWy9BIGv/8qzTdcd4LKwez7MdSLPST4zXPbMbvDHdEplbSdWPm6xlYCeQ0obh6YDJowp8alv6XFvTtR/LYVg33Xq2zFoNPOigiczZ/uX5fU6XWmy7Eaz7bS0Wr+qIpINiOm512tTUsU7Q5k/QWrz43TnyxJhvfa6gZqecZp5Lo+cmeGP66gi5Uw4a9exDKi6xtl6ptSfx2t8S0FuccLQvYTg+vxV2ixrm+WiBImCFWDLA4LIneeSUQ/6FnxNCDEpoddkjsCzDfBKW6tPyG1Rx1P2YAOWLJytEc8SrXkjaJOJ4UjxMIZExSmLM72uQTTz+3/kZJwGuNt/oNWA3+hnki/Qu5x8=","w":40,"h":40,"aspect":"fixed","title":"FTG: Automated Transformation"},{"xml":"dZLNbsMgDMefhjsNe4JkS0+7rIedKXEDK+AI2JK+/QwhayOtSJHsv3+OP4CJzi3HICf9jgNYJt6Y6AJiWi23dGAta7gZmHhlTcPpY03/JHooUT7JAD79k4DnL1CJCCvPuVgGegxOWhNdzXUfaGENXfahrUqT3X0DMd22pIDffoCMcibaWZsEp0mqHJ1pTtJ0crn2gcyo5YBzZUcrY6x2TAGv8GmGpEmhcu3FWNuhxVDKiL6crKNPDzovh3RqfPSkKVoFhAqeap8ZKDtopbqOpeXtHx49Ea1CZ1Ql1/F/ICRYni768LCVI6CDFG6EzHWETPD1MrgGM+qa9lI1GVd//Eu9XxsZddObWy9yc+8PpqC79/QL","w":100,"h":40,"aspect":"fixed","title":"FTG: Formalism"}]</mxlibrary>';

  const examplesLib = '<mxlibrary>[{"xml":"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","w":530,"h":690,"aspect":"fixed","title":"Super activity"}]</mxlibrary>';

  function parseStyle(str) {
    const pairs = str.split(';').filter(s => s !== '');
    const map = new Map();
    pairs.map(pair => {
      const [key,value] = pair.split('=');
      map.set(key, value);
    });
    return map;
  }

  function unparseStyle(map) {
    let str = "";
    for (const [key, value] of map.entries()) {
      if (value === undefined) {
        str += key + ';';
      } else {
        str += key + '=' + value + ';';
      }
    }
    return str;
  }

  function mapAssign(map1, map2, keys) {
    for (const key of keys) {
      const value = map2[key];
      if (value !== undefined) {
        map1.set(key, value);
      } else {
        console.log(key, value);
      }
    }
  }

  // Styles for our different edge types
  const styles = {
    control_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=2;"),
    data_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;"),
    detail: parseStyle("edgeStyle=0;endArrow=classic;html=1;dashed=1;strokeWidth=2;curved=1;fontColor=#000000;endFill=0;endSize=10;startSize=8;"),
    typed_by: parseStyle("edgeStyle=0;endArrow=blockThin;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;dashPattern=1 1;strokeColor=#666666;endFill=1;endSize=6;"),
    produce_consume: parseStyle("edgeStyle=0;endArrow=classic;html=1;"),
  };

  function checkEdge(ui, edge) {

    const model = ui.editor.graph.model;

    function setStyle(style_type) {
      // Set 'pmRole' property
      let value = model.getValue(edge);
      if (!value) {
        value = mxUtils.createXmlDocument().createElement('object');
        value.setAttribute('label', '');
      }
      value.setAttribute('pmRole', style_type);
      model.setValue(edge, value);

      // Update style
      // Workaround: don't overwrite connection points
      const oldstyle = parseStyle(model.getStyle(edge));
      const newstyle = new Map(styles[style_type]);
      mapAssign(newstyle, oldstyle, [
        // retain these properties from oldstyle:
        "entryX", "entryY", "entryDx", "entryDy",
        "exitX",  "exitY",  "exitDx",  "exitDy"
      ]);
      model.setStyle(edge, unparseStyle(newstyle));
    }

    const sourceCell = edge.source;
    const targetCell = edge.getTerminal();

    if (!sourceCell || !targetCell) {
      return;
    }

    const sourceType = sourceCell.getAttribute("pmRole");
    const targetType = targetCell.getAttribute("pmRole");

    function isActivity(type) {
      return type === "man_activity" || type === "autom_activity" || type === "super_activity";
    }
    function isTransformation(type) {
      return type === "man_transformation" || type === "auto_transformation";
    }
    function isControlNode(type) {
      return isActivity(type) || type === "initial" || type === "final" || type === "fork_join" || type === "decision";
    }
    function isArtifactPort(type) {
      return type === "artifact_inport" || type === "artifact_outport";
    }
    function isControlFlowPort(type) {
      return type === "ctrl_inport" || type === "ctrl_outport";
    }
    function isControlFlowConnectable(type) {
      return isControlFlowPort(type) || type === "initial" || type === "final" || type === "fork_join";
    }

    if (isControlFlowConnectable(sourceType) && isControlFlowConnectable(targetType)) {
      return setStyle("control_flow");
    }

    if (isActivity(sourceType)) {
      if (isTransformation(targetType)) {
        return setStyle("typed_by")
      }
    }

    if (sourceType === "artifact") {
      if (targetType === "formalism") {
        return setStyle("typed_by")
      }
      else if (isArtifactPort(targetType)) {
        // console.log("PM data-flow (consume) link")
        return setStyle("data_flow")
      }
    }

    if (isArtifactPort(sourceType)) {
      if (targetType === "artifact" || isArtifactPort(targetType)) {
        return setStyle("data_flow");
      }
    }

    if (isTransformation(sourceType)) {
      if (targetType === "formalism") {
        // console.log("FTG produce link")
        return setStyle("produce_consume")
      }
    }

    if (sourceType === "formalism") {
      if (isTransformation(targetType)) {
        // console.log("FTG consume link")
        return setStyle("produce_consume")
      }
    }

    return;
  }

  ui.editor.graph.addListener(mxEvent.CELL_CONNECTED, (_, eventObj) => {
    // This will change the edge style WITHIN the transaction of the edit operation.
    // The terminal-change and style-change will be one edit operation from point of view of undo manager.
    checkEdge(ui, eventObj.properties.edge);
  })

  // Load hardcoded FTG+PM library
  ui.loadLibrary(new LocalLibrary(ui, examplesLib, "FTG+PM: Examples"));
  ui.loadLibrary(new LocalLibrary(ui, primitivesLib, "FTG+PM: Primitives"));
});
