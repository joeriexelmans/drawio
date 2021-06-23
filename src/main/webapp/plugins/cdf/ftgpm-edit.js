Draw.loadPlugin(function(ui) {

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
    // control_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=2;"),
    control_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=2;fontSize=10;strokeColor=#004C99;"),
    // data_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;"),
    data_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=2;fontSize=14;fontColor=#000000;fillColor=#d5e8d4;strokeColor=#6D9656;"),
    // detail: parseStyle("edgeStyle=0;endArrow=classic;html=1;dashed=1;strokeWidth=2;curved=1;fontColor=#000000;endFill=0;endSize=10;startSize=8;"),
    typed_by: parseStyle("edgeStyle=0;endArrow=blockThin;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;dashPattern=1 1;strokeColor=#666666;endFill=1;endSize=6;"),
    // produce_consume: parseStyle("edgeStyle=0;endArrow=classic;html=1;"),
  };

  function checkEdge(ui, edge, fromTo) {

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

    for (const [from, to, linkType] of fromTo) {
      if (from(sourceType) && to(targetType)) {
        setStyle(linkType);
        return true;
      }
    }
  }

  // Hardcoded primitive shape and example libraries:

  const noportsPrimitivesLib = '<mxlibrary>[{"xml":"dVNbc6owEP41zPS8AalKH+VmsRZrRT3y0gkQDRIIJ4Trr29APK0z7UMme/t2s7tfJGCkzYLBHL/SCBEJWBIwGKX8KqWNgQiRVDmOJGBKqiqLI6n2L15l8Mo5ZCjjPwBocEEhFxEEBn0xc3BOMpgicY3g9J0SdPXBktMPzmBWnChLIY9pNgYRGCJMSYRYcVd6SDUY5gIrICjyfsDfHqz26n0vBW9v5QsM814sOMrCmDxcfDswC+dsWfu/dSe6Moyk258O8xnZJUvX0XMQyNq/NGl03TUmmd3iWbIBlyT3Y+N1WzgVXllejqy1pOr7VVIXYCMkpQ7D4w6TiQp86tj6TFvSpX+Ww7CsmuXUTGoNPOqgiqzp9uX5fUZN7ex4ESzbdSkWpeqIXDrFcj12XJXUtY/Q4U/Qnr/4zSk6iGe+tamCqo1ynB48Gj1XwVuhL/aQu3mn0YOzu4gk9vqQa/VRdPtHAnqNY462uRiyMNSCHsKGedqvTBEiQ0XcwWCYk9zrlEP+TT/FhBiUUDbMEdi2YT0JCugp4tCKYj6mue6iQoyj5lcCKd9WtEBUpGCtCKnjiONrxOOVYzJG8Rnzexsc6XH+j/xioxDGrd/UkZ839esfDKF33+QT","w":40,"h":40,"aspect":"fixed","title":"FTG: Automated transformation"},{"xml":"dVPbkqIwEP0aqnbfgIzKPg43B0dxHFFXXrYCRAMEwoZw8+s3XNwZq2aKStGX053uPh0JGFm7ZLDAGxohIgFLAgajlI9S1hqIEEmV40gCpqSqsjiSan/jVQavXECGcv5FAA0SFHKBIDDoLzMH5yyHGRK/KTh7pwSNvgzmfziDeXmhLIM8pvmIGQIGxAbmFSTeF5iCwBBhSiLEyofq7sWqvfrYR8m7+9UlhkUvlhzlYUx+JL4dmKVztazj7+YmOjKM9Ha8nJ4X5JCuXEcvQCBrf7O01XXXmOV2hxfpDiRp4cfGZl86NV5bXoGsraTqx3XalGAnJKUJw/MBk5kKfOrY+kJb0ZV/lcOwqtvV3EwbDTzpoI6s+f715X1BTe3qeBGsum0lSFJ1RJKbYrkeO68r6tpn6PBf0H5+9dtLdBJlvnWZguqdcp6fPBq91MFbqS+PkLvFTaMn55CIJPb2VGjNWXT7UwJ6g2OO9oWYnjA0YjWEDfOsp0sRIkNlfIPBMCe51ymH/JN+iQkxKKFsmCOw5v0n7Bni0IpiPqUZuagR46j9dnmUTxQtERUpWCcgTRxxPCKexv2SMYqvmD/a4MT79X/kxyYKYWL9rk67eVc/3sAAfXgi/wA=","w":40,"h":40,"aspect":"fixed","title":"FTG: Manual transformation"},{"xml":"dVJNb8IwDP01ufdjIHZt+ThxGZN2Do1pMpK4SsIK+/Vz0xSoNJAq7Pee4xfHrKzNded4J/coQLNyw8raIYYxMtcatGZFpgQr16woMvpYsX3B5pHNOu7Ahn8K8PgNTSCF5seh2TqSC8sN0F8qNh+oYeRO6AzXypuRirpIbOdEp3kDErUA52dOJmPFkM49+3Cb2ji8WAGDNGNl1UsV4NDRiQT0NBrCZDCD3ZxCL7nAPmlbzb1PsQ8Oz/ClRJCEULvqpLSuUaOLbUqxgJV4G3C04QnP4o9wulFrCWtoeuCS8JB8DoI4too35zZans6waElRNWhUk5T8EtCr36nQ03WUbT+xmwMVhoBmjlG2pMwB1fNj7J3fr/dke7l+Xy4GpYHAN0KFJBwn/wMuwPXlWuRPD7IDpCPcjSR9mh6xq3FzMgmqlamqTBhPr9zeKx87RkF64ylNWzelj+2O0tny/wE=","w":80,"h":30,"aspect":"fixed","title":"FTG: Formalism"},{"xml":"dVJdk5owFP01zLRvfFitjxBQtyxV2WrVtyCBBALBJID66zfA0tWZ7gPDPfeckzv3Q7NAcV1yWOGAxYhqlqdZgDMmh6i4AkSpZuok1ixXM01dfZq5+II1elavIEel/I+BRRk6S6WgMOqKuT3ZW4qQUTRkSEkkgXQgxqd73XNVIW+jRWBYdaGQqDwT+i0+LUJXvKSeF27au6oPwO6+RzdbCJI7dpX9NfUaJzmutll0Qn/A6bAlCnoO8NfLn47EM+9XdYH7pKbT3HZfrB0K/IvIq7B7zU0Jb5w6DcKgjX4cYsA10zms4ybNm8NmYUfG6+ptJc7babIV02b6e75e7ZUkDmo9cwN7k852Rz2LDDN/bQJrpqi6nKhGFseTn/rLWViIVQ2OKu/48qJ+k+CS2Kp797tmOS0mEr1V8Ny13KrlqRyWRTdQQ4UJoRQwyng/G0vXJ2A+V3khOcvRyJSsVHaHI0HuMOoHqSuMYiIfIGcSPuJhKQ3iEl2/3LnxsKslYgWS/KYkLYklHhTWcBY6RiTF8jkHxYDTf87PA1LBx/pH+HFSI/w83V76dNnv","w":30,"h":30,"aspect":"fixed","title":"PM: Initial"},{"xml":"dVNrr6IwEP01JHe/8bgS+CjPgMAqZlH5VrA8vIViWwTvr98KuleTNSnJnDlzOmTmVFDMZnQJ6KoQHyESFFtQTIIxm6NmNCFCgizWR0GxBFkW+SfIzhtWmlixAwS27D8CnJ1gzngFAtmtmTWRk6SJMYJzpqhbgOb04+Kp6rUnZdeHgFagu4WUwTav0UeRBIFFvdJeX8Flu7ahlSb8H9T1luzGFV46oaprgbHR9YPte2kJXCVBy8hRJW/wW5Nuot+WNjoX6HWD1HPlobymwap1MxYKssGPRUsjknBcb/7AEvvOPi8T5dRkse2p4igeXKrF1OGFq7BfI7q4+KPeyAt+1VklktS7huZHMRg7XW1xv08X39FCkwID5dsyPlu70Ki4+FMHqXTiwT7CyeBnSbJMhzb1oqI4ayKjvbLZRS3n7aoozV+CYgxVzeC2A/ltHANfK89VrLmNWuJhUSNkYoTJNDdFFD9NXed5ygj+gu+ZXX1kFWf4DgwCaf0Nsmn2IsfwWLMnSDADz3je4wUSBse3JpGe1utC3EBGrrxkuLflrDL7SKxgXVbsNQfojMt/yh/H8eDumAe8e/ABf7w+lb48hb8=","w":30,"h":30,"aspect":"fixed","title":"PM: Final"},{"xml":"dVI9c8IwDP01XntO0gyMJbRMXcrQsWdiQQyOlXPUAv31lRynlLsy+E567+nbqmr68zqaoXtFC15Vz6pqIiJNVn9uwHtVamdVtVJlqfmp8uUOWyRWDyZCoH8CcHuAlljhzVaKrRKZQvo39DAhO4zHjwO6MFFz8qS8rTvSZQ6K+BksiFSrannqHMFmMK2wJx6PsY56KVmwucNAG/ctZCHykSIe4d1Z6hgqReG8b9BjTNkrrR+bxYJx490+MNbygMDk8gsiudb4p0z0zlrpKeeccwQMAg48FY2Ss16qesUIWEdmm6aQTqaRJSmc7+60+LOJNWAPFC8sOeX+RaH1Qz0FduD2XQ7M19BmnPz9b/D1Rmzk/c5uvtrsXn9Hkt58nh8=","w":100.5,"h":20,"aspect":"fixed","title":"PM: Fork/join"},{"xml":"dVNLk6IwEP41VO3eAkHQo/ISkXUHVGa98YgQBeIkGUF+/QTQmbFq5wDV36Pp0N2RoFG1Do0vhU8yVErQkqBBCeFjVLUGKktJATiToCkpChCPpNg/qPKggktMUc3/k0CSE0q5cJRx0hczB3FIqQJSopHJUIoZJvWoPL49GJ/LMn575LAivvQh46hOcfmrPqy4ydzcdA9/GygpCwvN590s0N3NGTlsbmj6MbmxUNHMw+ZgrdZKEsy8CLysI92PLN+SSZVZt7l9OsJ3PZqdfM4WWVrGuOi8Cd1utHyn7ZL8xd3/84P12wnkV3PVqoFpaNp+modFuQcE212nEthOKh3sJq+Uem0Uv/hJg0O4tkPdwsmE7MXpChdCDSxt1qxMHxy9q2jZbeGSreqmjdCXiXi5qH3zPCepltPddP/qkLUS52qx6//PDkKrdM4i+JPP22wb1ZoFqBPI198SXDQF5ii8xGnfokZMW3AFr/oJyCKk5L3OUN9nINCR1DzEXW+Ve8w4JWdkkJJQQdWkRp9khDNeCFLp03BZPkySAgFQjdlM8CjDPE6GOYGhFo+fMGK4+4bHoV8R5aj9cankb7vgIFIhTm/C0tyPI1R13DtQIJwX/JmL2Yjzz8yvDRXBfb0e8L6zD/h1Nwbr09X5AA==","w":40,"h":40,"aspect":"fixed","title":"PM: Decision/merge"},{"xml":"dVPbjpwwDP2avFYMiFH3cWFn9qVVpd2V+lgZ4oF0Q0xDmEu/vs6FYWbVRaDgc45jO45FUQ/nZwtj/50kalHsRFFbIhf/hnONWos8U1IUTyLPM/5Evv+E3QQ2G8Gicf9xoOY3to4VGhof7CmQW83a6kDGMy1psoHZ/pl9GpXIiyw8t9C2S2vwnVegNDAgLwvV2CtXPAqfTuku462Cs5s/bshYzGeBQ1nDC2mMWcPsaPgFrVNH5S6RD5FXFhzKD4oQOSgeF8WbBTMdyLKhyKRAGlrsSUu0093BLuece/O+BZO7LLlZmo1EL91w7qdeOXwdeUcGTtxpxno36ERPztI7/lTS9QnxhdfXLhSH8DDeMg7KoE067pSGcVJNiJsxIi2Nb2A7dEkCtn1Vfz39la2RlHGhoLLil1tRZ19KUXKUmu3NavNbVIa+pVvi9z4orW+y2u/r3QPfqspiO9tJHfEFpxjKq/E8gpHJaKB978Kh/Jid5goSzgUZvo4QC/D5DuhgJ9WSfjz0I1qH508v+OamF89IvIXlbmendKJe8ZBHtx5V1ye3bRyMDFKHu6vrOi78k/q7mGmAFnMd1CC9m+N/","w":192,"h":60,"aspect":"fixed","title":"PM: Automated activity"},{"xml":"dVPfb5wwDP5rIm0vFQfitD0O7tqXVZPaSnucDPgga0iYMfdjf/2cEMpdtULuiP19cezPicrK/vxAMHSPrkGjsr3KSnKO51l/LtEYlSa6UdlOpWkiP5Xef4BuApoMQGj5Pwtc9RtrFoaBym+2C+DWCLeYxD3yxWBwb/9MPoeidsaRyr4JSG31SaLJKOX/avZ5pcusnb+5hR7ls4Sv6A0L0QTiy3DNkCyndX2oo39yMZ+0B/sLatZHzZcZDRss2ATmHRyiB/gxwC8Edjw46oG1s3EDAzV2zjRI442Ci6CpN2+1XjVKyU22QU/dSM6nTjM+DxJRHCdpqfg67k2ERyb3ij91w130HJzlctZXomWH8ATNLYO2SJEnPTAwjLoK+ybiacgNL0AtcqQA1c/6r4e/iDU4bTkUlBcyfJ+Su1zlO9+wvNistoyssO57PA4+NmE90aiP+ITjHNJ78TyAbaJx0MZcJb7f+tf3GOrXNojyY2IjFUS+FGTl3MFcgM+3R4Z9o5f0Z9GPSIznD0/y5qoXD+gkBEmrk1NU1DO+zqc96VC3XVy2jT6IHW7flq73Qiaxv4sZb8pirjcyUG8u7D8=","w":190,"h":60,"aspect":"fixed","title":"PM: Manual activity"},{"xml":"dVPJcsIwDP0a35O40DOkLadeoDM9dkQiiFvHzthi69dXXkLDtGQGYj3pPS1WhKz788rB0L3aFrWQz0LWzlpKp/5co9aiKlQr5JOoqoJ/onq54y2jtxjAoaF/CHb7iQ1xhIZtSPYUnTMDPfKLcSEX4b+a0WVIUNTr11ZjCveHAd0HNKSOii7JH/l3vVEqejfB++bA+J11PZCyJifQ0GBndYvO33QyNlYF87ZnT5explOnCDcDa7B94mEKueyoDw2WfPTk7Be+q5a6jOyU1rXV1kW+fOGnrhlvrCFQBl2OO6Ij1YBeaLU3jJEN0juO2uTsD9meqBXxYRwyq+HLCJJLh83BeXXENXr1HeghDM8DmDYbXIHhK4JtVC8jojUMXiUkxPRI8NwqygFpUqFUPN9dg3IywBValnB8PcUpD4W9Us4TrUO17zKtekz7U0C+l/2Ve5Vbh3rNnsurilzAfKRdkj2ak3TlrPibTs5us4HmwRkgXNqDaf10lfkw6eQXitsxmnnfR/P3u0rs6Wf3Aw==","w":336,"h":270,"aspect":"fixed","title":"PM: Super activity"},{"xml":"dVLLcsMgDPwa7n40mfZYO21OvTSd6VkxiqHByINJnfTrKzDOYyY5GEurlbQIibLujmsHvfogiUaUb6KsHZGfrO5YozGiyLQU5UoURcafKN4fRPMYzXpwaP2dBNr+YOOZYWAbmq1icGGhQ/4xLsrXcBYLf+onKNbrPsngRAfn9Q5CkRgx0KAiI9ENNxJiyTsJsW7Ev2KH4kp9Edzbiw3+NDd2dLASA5VVVqPSHjc9d2dg5PkxpnwX7pSzOSiQNCZua2AYkj14R3v81tIrRrhdtdPG1GTIxTalXOCzfGIcjG4tYw2PEl0gkvWbpCcQ4gwraPZtlDbXsGSZUTXU6SY1hYOnQf/hrIFla9uyt2TPIYdgG8vmZ4VXiparl+UiMDv08Ca1T8RpeL/oPB4fPn9+NdM1EpdwJ6aMaQCBkU0rkinUrUppZcIgvWp7Tr0sExvpnWY3rdfsXtY4Um+2/B8=","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact"},{"xml":"dVJfT8MgEP80vLela/TRtbonE+MefDSs3DqU9hY4tfXTS6HtaNxISO5+f+6Ag/Gy7XdGnE/PKEEz/sh4aRApRG1fgtYsS5RkvGJZlrjNsqcbbOrZ5CwMdHTFgIcPqMkptDiMzSpPekv7ihoCIgWJ96PGn0DNxb1y3dfSMJtANrCf0oTxLXTywRhXg1e1Ftaq2oEnaseuqQstGfyENyXp5BBXeHvEjvbqdyyQ5lNeokbjG/DErxFXWke43MCdzJeKEVNU98WmcEy4x3jCm8+URpfbAbZAZnASA1qQ+l77hA1ps+gW6wuqbnzfISjyZO2w+GVqmETxHGdff91HwjRA/3wuiE57gfx05nSa+Zxe/lZwx1/vDw==","w":40,"h":40,"aspect":"fixed","title":"Data flow"},{"xml":"dVLNToQwEH6aXk1L0Q1Hl9U9mRj34NF0YRaqhdm0VcGnd6CUhegeSGbm+xvaMpk33d6qc/2EJRgmH5jMLaIPVdPlYAxLuC6Z3LEk4fSx5PEKKkaUn5WF1v8jwOM7FJ4YRh2HsN0IjpLmBQ2ESYGtt2jeTga/Axr9R/I62vk+6qCs4DC1nMkttOW9teQhd4VRzumChrVvhmBBpaOUD3jVpa9pQsbbEyUf9M9gIPjMyNGgHSMk52meZYSEvYbEq38uFsvuARvwtieKBaO8/lrrlAttNfNm6TPqdjiyPjBSvlY4/LQFTKTl1URdF3U3nMvbJEuF2Nylm7WLV7YC/8eFisXul9F49rGdLjW2l8cT1Mu39Qs=","w":40.003529411764895,"h":40,"aspect":"fixed","title":"PM: Control flow"},{"xml":"dVJNb4MwDP01uQeodt/o2tOkqp204xSIV7KGGAVvg/365YsCWhspkt+zn+3YYUXZDnsruuYFJWhWPLOitIgUrXYoQWuWcyVZsWV5zt1l+e6ONwte3gkLhm4IsPqEmlyEFpUvtg3OIGmPqCEyNHYg36sxeqbcIXBdtqdx0oA8wylBzoonMPLRWvxxsNJYX14bZRzdUOvLZs7syeIF3pSkJjEfaOikfn2KbJNwiRptKFHwcBwvRd+ATCIPDoIIrAlMzufkC/FDOLGxndJTEw6lit4XH+yfcnec2WIKe8AWyLo5cQtakPpe60Qf4fkad5UeUBm/hzFGbPha0eOXrSEFLfc96YbbOhL2DPRP54xFtzMV1jjB9DcmOP/BqF5+0T8=","w":40,"h":40,"aspect":"fixed","title":"Typed-by"}]</mxlibrary>';

  const noportsExamplesLib = '<mxlibrary>[{"xml":"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","w":700,"h":513.9999999999995,"aspect":"fixed","title":"Example: Fictional FTG+PM"}]</mxlibrary>';

  const portsPrimitivesLib = '<mxlibrary>[{"xml":"dVNbc6owEP41zPS8AalKH+VmsRZrRT3y0gkQDRIIJ4Trr29APK0z7UMme/t2s7tfJGCkzYLBHL/SCBEJWBIwGKX8KqWNgQiRVDmOJGBKqiqLI6n2L15l8Mo5ZCjjPwBocEEhFxEEBn0xc3BOMpgicY3g9J0SdPXBktMPzmBWnChLIY9pNgYRGCJMSYRYcVd6SDUY5gIrICjyfsDfHqz26n0vBW9v5QsM814sOMrCmDxcfDswC+dsWfu/dSe6Moyk258O8xnZJUvX0XMQyNq/NGl03TUmmd3iWbIBlyT3Y+N1WzgVXllejqy1pOr7VVIXYCMkpQ7D4w6TiQp86tj6TFvSpX+Ww7CsmuXUTGoNPOqgiqzp9uX5fUZN7ex4ESzbdSkWpeqIXDrFcj12XJXUtY/Q4U/Qnr/4zSk6iGe+tamCqo1ynB48Gj1XwVuhL/aQu3mn0YOzu4gk9vqQa/VRdPtHAnqNY462uRiyMNSCHsKGedqvTBEiQ0XcwWCYk9zrlEP+TT/FhBiUUDbMEdi2YT0JCugp4tCKYj6mue6iQoyj5lcCKd9WtEBUpGCtCKnjiONrxOOVYzJG8Rnzexsc6XH+j/xioxDGrd/UkZ839esfDKF33+QT","w":40,"h":40,"aspect":"fixed","title":"FTG: Automated transformation"},{"xml":"dVPbkqIwEP0aqnbfgIzKPg43B0dxHFFXXrYCRAMEwoZw8+s3XNwZq2aKStGX053uPh0JGFm7ZLDAGxohIgFLAgajlI9S1hqIEEmV40gCpqSqsjiSan/jVQavXECGcv5FAA0SFHKBIDDoLzMH5yyHGRK/KTh7pwSNvgzmfziDeXmhLIM8pvmIGQIGxAbmFSTeF5iCwBBhSiLEyofq7sWqvfrYR8m7+9UlhkUvlhzlYUx+JL4dmKVztazj7+YmOjKM9Ha8nJ4X5JCuXEcvQCBrf7O01XXXmOV2hxfpDiRp4cfGZl86NV5bXoGsraTqx3XalGAnJKUJw/MBk5kKfOrY+kJb0ZV/lcOwqtvV3EwbDTzpoI6s+f715X1BTe3qeBGsum0lSFJ1RJKbYrkeO68r6tpn6PBf0H5+9dtLdBJlvnWZguqdcp6fPBq91MFbqS+PkLvFTaMn55CIJPb2VGjNWXT7UwJ6g2OO9oWYnjA0YjWEDfOsp0sRIkNlfIPBMCe51ymH/JN+iQkxKKFsmCOw5v0n7Bni0IpiPqUZuagR46j9dnmUTxQtERUpWCcgTRxxPCKexv2SMYqvmD/a4MT79X/kxyYKYWL9rk67eVc/3sAAfXgi/wA=","w":40,"h":40,"aspect":"fixed","title":"FTG: Manual transformation"},{"xml":"dVJNb8IwDP01ufdjIHZt+ThxGZN2Do1pMpK4SsIK+/Vz0xSoNJAq7Pee4xfHrKzNded4J/coQLNyw8raIYYxMtcatGZFpgQr16woMvpYsX3B5pHNOu7Ahn8K8PgNTSCF5seh2TqSC8sN0F8qNh+oYeRO6AzXypuRirpIbOdEp3kDErUA52dOJmPFkM49+3Cb2ji8WAGDNGNl1UsV4NDRiQT0NBrCZDCD3ZxCL7nAPmlbzb1PsQ8Oz/ClRJCEULvqpLSuUaOLbUqxgJV4G3C04QnP4o9wulFrCWtoeuCS8JB8DoI4too35zZans6waElRNWhUk5T8EtCr36nQ03WUbT+xmwMVhoBmjlG2pMwB1fNj7J3fr/dke7l+Xy4GpYHAN0KFJBwn/wMuwPXlWuRPD7IDpCPcjSR9mh6xq3FzMgmqlamqTBhPr9zeKx87RkF64ylNWzelj+2O0tny/wE=","w":80,"h":30,"aspect":"fixed","title":"FTG: Formalism"},{"xml":"dVJdk5owFP01zLRvfFitjxBQtyxV2WrVtyCBBALBJID66zfA0tWZ7gPDPfeckzv3Q7NAcV1yWOGAxYhqlqdZgDMmh6i4AkSpZuok1ixXM01dfZq5+II1elavIEel/I+BRRk6S6WgMOqKuT3ZW4qQUTRkSEkkgXQgxqd73XNVIW+jRWBYdaGQqDwT+i0+LUJXvKSeF27au6oPwO6+RzdbCJI7dpX9NfUaJzmutll0Qn/A6bAlCnoO8NfLn47EM+9XdYH7pKbT3HZfrB0K/IvIq7B7zU0Jb5w6DcKgjX4cYsA10zms4ybNm8NmYUfG6+ptJc7babIV02b6e75e7ZUkDmo9cwN7k852Rz2LDDN/bQJrpqi6nKhGFseTn/rLWViIVQ2OKu/48qJ+k+CS2Kp797tmOS0mEr1V8Ny13KrlqRyWRTdQQ4UJoRQwyng/G0vXJ2A+V3khOcvRyJSsVHaHI0HuMOoHqSuMYiIfIGcSPuJhKQ3iEl2/3LnxsKslYgWS/KYkLYklHhTWcBY6RiTF8jkHxYDTf87PA1LBx/pH+HFSI/w83V76dNnv","w":30,"h":30,"aspect":"fixed","title":"PM: Initial"},{"xml":"dVNrr6IwEP01JHe/8bgS+CjPgMAqZlH5VrA8vIViWwTvr98KuleTNSnJnDlzOmTmVFDMZnQJ6KoQHyESFFtQTIIxm6NmNCFCgizWR0GxBFkW+SfIzhtWmlixAwS27D8CnJ1gzngFAtmtmTWRk6SJMYJzpqhbgOb04+Kp6rUnZdeHgFagu4WUwTav0UeRBIFFvdJeX8Flu7ahlSb8H9T1luzGFV46oaprgbHR9YPte2kJXCVBy8hRJW/wW5Nuot+WNjoX6HWD1HPlobymwap1MxYKssGPRUsjknBcb/7AEvvOPi8T5dRkse2p4igeXKrF1OGFq7BfI7q4+KPeyAt+1VklktS7huZHMRg7XW1xv08X39FCkwID5dsyPlu70Ki4+FMHqXTiwT7CyeBnSbJMhzb1oqI4ayKjvbLZRS3n7aoozV+CYgxVzeC2A/ltHANfK89VrLmNWuJhUSNkYoTJNDdFFD9NXed5ygj+gu+ZXX1kFWf4DgwCaf0Nsmn2IsfwWLMnSDADz3je4wUSBse3JpGe1utC3EBGrrxkuLflrDL7SKxgXVbsNQfojMt/yh/H8eDumAe8e/ABf7w+lb48hb8=","w":30,"h":30,"aspect":"fixed","title":"PM: Final"},{"xml":"dVI9c8IwDP01XntO0gyMJbRMXcrQsWdiQQyOlXPUAv31lRynlLsy+E567+nbqmr68zqaoXtFC15Vz6pqIiJNVn9uwHtVamdVtVJlqfmp8uUOWyRWDyZCoH8CcHuAlljhzVaKrRKZQvo39DAhO4zHjwO6MFFz8qS8rTvSZQ6K+BksiFSrannqHMFmMK2wJx6PsY56KVmwucNAG/ctZCHykSIe4d1Z6hgqReG8b9BjTNkrrR+bxYJx490+MNbygMDk8gsiudb4p0z0zlrpKeeccwQMAg48FY2Ss16qesUIWEdmm6aQTqaRJSmc7+60+LOJNWAPFC8sOeX+RaH1Qz0FduD2XQ7M19BmnPz9b/D1Rmzk/c5uvtrsXn9Hkt58nh8=","w":100.5,"h":20,"aspect":"fixed","title":"PM: Fork/join"},{"xml":"dVNNj5wwDP01uVYMiFH3uLAze2lVaXelHqtAPJBuiKkJ89FfXyckw8yqi0DB7z3HdhyLoh7OzyTH/jsqMKLYiaImRLf8DecajBF5ppUonkSeZ/yJfP8JuwlsNkoC6/7jgM1vaB0rjGx8sKdAbg1rqwNaz7RokAKz/TP7NCqRF1l4bqFtF9fgO69AaeUAvCSqoStXPAqfTuku462Cs5s/bsjYkk+CQ1nDCxpYspazw+GXbJ0+andZ+BB5ZaUD9UERIgfFY1K8kbTTAYkNjTYGMrKFHo0Cmu4ONp1z7s37FkzuknIjnK0CL91w7qdeO3gdeUcGTtxpxno3mEhPjvAdfmrl+oj4wutrF4pDeBhvGZfaAkUdd8rIcdJNiJsxogjHN0kduCiR1L7qv57+ytaI2rpQUFnxy62osy+lKDlKzfZmtfktKovf4i3xex+0MTdZ7ff17oFvVUXQzjTpI7zAtITyajiP0qpoNLJ978Kh/Jid4QoizgVZvo5yKcDnO4CTO6VT+suhH4EcnD+94JubXjwD8hbE3c5O8UR9tx7Kxa0H3fXJLU5GJmOLu6vvOi/8ExuczDhByVwnNUjvBvkf","w":295,"h":120,"aspect":"fixed","title":"PM: Automated activity"},{"xml":"dVPfb5wwDP5rIm0vFQfitD0O7tqXVZPaSnucDPgga0iYMfdjf/2cEMpdtULuiP3Zju0vVlnZnx8Ihu7RNWhUtldZSc7xvOvPJRqj0kQ3KtupNE3kp9L7D9BNQJMBCC3/x8FVv7FmsTBQ+cN2AdwasS0mUY98MRjU2z+Tz6GonXGksm8CUlt9kmiySvm/2n1ezWXXzt/cQo/yWcJX9IaFaALxZbi2kCyn1T/U0T+5mE/ag/0FNeuj5suMhgMWbALzDg7RA/wY4BcCOx4c9cDa2XiAgRo7Zxqk8aaDS0NTL972eu1RSm6yDXrTjeR86jTj8yARRXESSkXXcW8iPDK5V/ypG+6i5uAsl3N/JVp2CE/ouWXQFinaCQcGhlFX4dxENA254QWoRY4mQPWz/uvhLyINTlsOBeWFLM9TcperfOcJy4vNKsvKCuu+x+vgYxPWE436iE84ziG9Fs8D2CYKB23MVeL7rX89x1C/tqEpPyY2UkG0l4Ks3DuYC/D59siwb/SS/tz0IxLj+cObvLni4gGdhCChOjnFjnq2vuazW4e67Ra3OAIJRIrbN991MGQTCV7EOCqLuI5kML2Z2H8=","w":295,"h":120,"aspect":"fixed","title":"PM: Manual activity"},{"xml":"dVPJcsIwDP0a35O40DOkLadeoDM9dkQiiFvHzthi69dXXkLDtGQGYj3pPS1WhKz788rB0L3aFrWQz0LWzlpKp/5co9aiKlQr5JOoqoJ/onq54y2jtxjAoaF/CHb7iQ1xhIZtSPYUnTMDPfKLcSEX4b+a0WVIUNTr11ZjCveHAd0HNKSOii7JH/l3vVEqejfB++bA+J11PZCyJifQ0GBndYvO33QyNlYF87ZnT5explOnCDcDa7B94mEKueyoDw2WfPTk7Be+q5a6jOyU1rXV1kW+fOGnrhlvrCFQBl2OO6Ij1YBeaLU3jJEN0juO2uTsD9meqBXxYRwyq+HLCJJLh83BeXXENXr1HeghDM8DmDYbXIHhK4JtVC8jojUMXiUkxPRI8NwqygFpUqFUPN9dg3IywBValnB8PcUpD4W9Us4TrUO17zKtekz7U0C+l/2Ve5Vbh3rNnsurilzAfKRdkj2ak3TlrPibTs5us4HmwRkgXNqDaf10lfkw6eQXitsxmnnfR/P3u0rs6Wf3Aw==","w":336,"h":270,"aspect":"fixed","title":"PM: Super activity"},{"xml":"dVLLcsMgDPwa7n40mfZYO21OvTSd6VkxiqHByINJnfTrKzDOYyY5GEurlbQIibLujmsHvfogiUaUb6KsHZGfrO5YozGiyLQU5UoURcafKN4fRPMYzXpwaP2dBNr+YOOZYWAbmq1icGGhQ/4xLsrXcBYLf+onKNbrPsngRAfn9Q5CkRgx0KAiI9ENNxJiyTsJsW7Ev2KH4kp9Edzbiw3+NDd2dLASA5VVVqPSHjc9d2dg5PkxpnwX7pSzOSiQNCZua2AYkj14R3v81tIrRrhdtdPG1GTIxTalXOCzfGIcjG4tYw2PEl0gkvWbpCcQ4gwraPZtlDbXsGSZUTXU6SY1hYOnQf/hrIFla9uyt2TPIYdgG8vmZ4VXiparl+UiMDv08Ca1T8RpeL/oPB4fPn9+NdM1EpdwJ6aMaQCBkU0rkinUrUppZcIgvWp7Tr0sExvpnWY3rdfsXtY4Um+2/B8=","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact"},{"xml":"nVTbbtswDP0aP3bwZTa6x9ju+tIBRRtgj4NiMbY2WfRkNU729aNk+dalWzHABsjDw4soikFStOd7zbrmC3KQQXIXJIVGNKPUnguQMohDwYOkDOI4pD+IP79hjZw17JgGZa444OE7VIYYkh1sstIZM0ncnIsTibUVJ+jwGjiist69uUhw3tnPF5wMN734ReiOCLfdebFNQYSawlA9Y6RtdIL/yEjYlcLeB/UdUwuWdqiNYi2QuIq+Jf0t6TXmv2iuG5TQXLr/zvtOsrt4ySpoUHLQ/WYiXH4H7F0ljtw+ob/GmDPDvtkLcoapUc60tC1eTVps1e0QLlMRa3xRHCw1pNqGRhh47qg0AgaadcIa09r5i0jUQIPDDs7X6lxjt2e6BuOBimaFCQV61qVkXS9GF5sBT6CPEgdST8IbcoUPfsotxR6jQNUbTaHMExpmBKrJCFq0YFwGTS+EqVrC4wLmvWLdHh9RuGdlXcjC7rhYamxFNacimut/mtNH91+EH9Igpc4UVieZkFd6NOvRwqcvyZmkk+20xqH3CfS2eqAyVv2jXhhRMbmToraUVnDuGsI8UNFyGE9FdyJU/QDH6VQeIS1etD3SjZU3mX/nz+6Zl5HlH4WUBUrU7t4TnsIt/2g9jcYf8FVw00yxHLLiZuWnLM3m0bVVw/nNNRat5u0ekLqvL0QZfAaypuOmCxsQdWO2GPOvoZ49l51Igh/hSfVbclKXbeyom2X9Gw==","w":50,"h":50,"aspect":"fixed","title":"PM: Artifact input port"},{"xml":"nVTbbtswDP0aP3bwZTa6x8Tu+tIBRRtgj4NiMbY6WfRk5bavH8XIcdylW1HABsjDw4soilFWdod7K/r2G0rQUXYXZaVFdCepO5SgdZTGSkZZFaVpTH+Ufn3DmrA17oUF46444PoFakcMLdY+WcXGQhN3KdWOxMaLI7R+DWzQeO/BHTWwd/Fri6PhZlC/CV0Q4bY/TLYxCG7dGIcKOoWahyf4r5SEXansfdDQCzNheY/WGdEBiRfR56R/Jb3G/B+N20EJ3bH/cN53kvnmtaihRS3BDrOR4PwMrLgSJndPGO4xlcKJH3xDbBk7xbapb+nFrKVenY/hNBepxa2R4KkxFbdvlYPnnmojYE/TTljrOj+BCYkWaHTEmn29Li32K2EbcAGoaViEMmDPutaiH9TJxWfAHdiNxj2pOxUMS4MPYc49xR+jRDM4S6HcEzrhFJrRCFZ14DiDpTciTKPhcQKXgxH9Ch9R8cPyLmQRd1JNNXaqPqciGl9AvqSPBqCMP+VRTp0pvU4yIa/05KwnE5++bCk0nWxhLe6HkMDOqwcq46J/1AunaqEXWjWe0ikpuSEiADWth9Op6E6UaR5gM54qIKSlk7ZCurHqpggv/ZkfepV4/kZpXaJGy/eeyRxu5Wfv6Sz+hO9KunaMxcgFt6i+FHlxnl1fNRzeXGTJxbzdA1L37ZEo+5CBrPlp18UtqKZ1c0yE59CcPaetSEIY4VENe3JUp33M1Nm6/gM=","w":50,"h":50,"aspect":"fixed","title":"PM: Artifact output port"},{"xml":"jVTBbtswDP0aHzvYchysx9hJe+mAog2w46DYrK1VFj1ajdN9/ShFtpM0xQokAPkeKT5StKK0aA/3JLvmB1ago3QTpQUh2qPVHgrQOhKxqqJ0HQkR8z8Sd5+wiWfjThIYeyUBd7+htByh5c4VW3tyqTk2r9SezdqZI7S7BF7QuOzevmvw2cs/bzgSN736y+iKA753h5kbD1FmPIb1HE86P53hDxUZuyLsa9BX1SbxNbmRyDoka2QLbP5f+hUBl6i/Gy1LaFBXQP35pbVPGHSK0pL+5ebliVGFp2ZN4uTihXPPd2JuWxC+mQpcaMw6hkZZeO5YBgMDrx5jjW3dOiRsEvBk5M7nOr8i7LaSarABKLl/qQzQ5Gstu14dU1wF3AO9aBzY3atA5AYfwtK5ENdGgaa3xEfZJ7TSKjQjCaRasL4C8cJKU2t4nMG8N7Lb4iMqv+UuhRm5qdSssVXlVIrD/KyznH/8QRTxtyzKeDKF89lm5MJPJj+Z4/mX5lJzZysiHPpQgM7VA8s4mR/PwqpS6pVWtQtpVVX5gcgAlPyt+q7cYj37rVwnwvlK6wI1kr/FdL3YJHeZ694SvsIJE8eL4vbWMXyrytRb5Dtd3yyn2J+qsg1DYlpDpwoOn74ayck+3QPydOmdQ4ZwDrPZ8WGJG1B1E7IWAZNhs+spc36C2AgrOrrhURrd+fHzoWdv4z8=","w":50,"h":40,"aspect":"fixed","title":"PM: Control flow input port"},{"xml":"jVRNb9swDP01Pnaw5ThYj7Gd9rIBRRtgx0GxWVubLHq08tH9+lGKbCdpihVIAPI9UnwiaUVp0R0fSfbtd6xBR+k6SgtCtCerOxagdSRiVUdpGQkR8z8SDx+wiWfjXhIYeyMBt7+gshyh5dYVKz251Byb12rPZuPMEdpeA69oXPZg3zT47OWfHY7E3aD+MrrigK/9cebGQ3Bnx3NY0Omoy+MZfleSsRvKPgd9Vm4S39IbiaxHskZ2wOb/pd8QcI364WhZQYu6Bhoup9Y9Y9ApKkv6p2+YZ0YZnptFibPRC+debsV8b0G4MzW40JiFHFpl4aVnHQwcePkYa23nFiJhk4BbI7c+1/k1Yb+R1IANQMUNkMoATb7Wsh/UKcVVwD3Qq8YDu3sViNzgt7B2LsRdo0AzWOKj7DNaaRWakQRSHVhfgXhlpWk0PM1gPhjZb/AJld9zl8KMXNdq1tipairFYb7ZWc4//iSK+EsWZdyZwvlsM3LlJ5OfzPH8S3Op+WYrIjwMoQBdqgeWcdY/7oVVldQrrRoX0qm69g2RAaj4a/W3cpv14teyTITzldYFaiQ/xbRcrJOHzN3eEv6GMyaOF8X9vWN4qso0G+SZlnfLKfaHqm3LkJj20KmC44fvRnK2T4+A3F1645BDOIfZ7PS0xC2opg1Zi4DJsNrNlDk/QmyEFR3d8CyN7vz8+dCL1/Ef","w":50,"h":40,"aspect":"fixed","title":"PM: Control flow output port"},{"xml":"dVJfT8MgEP80vLela/TRtbonE+MefDSs3DqU9hY4tfXTS6HtaNxISO5+f+6Ag/Gy7XdGnE/PKEEz/sh4aRApRG1fgtYsS5RkvGJZlrjNsqcbbOrZ5CwMdHTFgIcPqMkptDiMzSpPekv7ihoCIgWJ96PGn0DNxb1y3dfSMJtANrCf0oTxLXTywRhXg1e1Ftaq2oEnaseuqQstGfyENyXp5BBXeHvEjvbqdyyQ5lNeokbjG/DErxFXWke43MCdzJeKEVNU98WmcEy4x3jCm8+URpfbAbZAZnASA1qQ+l77hA1ps+gW6wuqbnzfISjyZO2w+GVqmETxHGdff91HwjRA/3wuiE57gfx05nSa+Zxe/lZwx1/vDw==","w":40,"h":40,"aspect":"fixed","title":"Data flow"},{"xml":"dVLNToQwEH6aXk1L0Q1Hl9U9mRj34NF0YRaqhdm0VcGnd6CUhegeSGbm+xvaMpk33d6qc/2EJRgmH5jMLaIPVdPlYAxLuC6Z3LEk4fSx5PEKKkaUn5WF1v8jwOM7FJ4YRh2HsN0IjpLmBQ2ESYGtt2jeTga/Axr9R/I62vk+6qCs4DC1nMkttOW9teQhd4VRzumChrVvhmBBpaOUD3jVpa9pQsbbEyUf9M9gIPjMyNGgHSMk52meZYSEvYbEq38uFsvuARvwtieKBaO8/lrrlAttNfNm6TPqdjiyPjBSvlY4/LQFTKTl1URdF3U3nMvbJEuF2Nylm7WLV7YC/8eFisXul9F49rGdLjW2l8cT1Mu39Qs=","w":40.003529411764895,"h":40,"aspect":"fixed","title":"PM: Control flow"},{"xml":"dVJNb4MwDP01uQeodt/o2tOkqp204xSIV7KGGAVvg/365YsCWhspkt+zn+3YYUXZDnsruuYFJWhWPLOitIgUrXYoQWuWcyVZsWV5zt1l+e6ONwte3gkLhm4IsPqEmlyEFpUvtg3OIGmPqCEyNHYg36sxeqbcIXBdtqdx0oA8wylBzoonMPLRWvxxsNJYX14bZRzdUOvLZs7syeIF3pSkJjEfaOikfn2KbJNwiRptKFHwcBwvRd+ATCIPDoIIrAlMzufkC/FDOLGxndJTEw6lit4XH+yfcnec2WIKe8AWyLo5cQtakPpe60Qf4fkad5UeUBm/hzFGbPha0eOXrSEFLfc96YbbOhL2DPRP54xFtzMV1jjB9DcmOP/BqF5+0T8=","w":40,"h":40,"aspect":"fixed","title":"Typed-by"}]</mxlibrary>';

  const portsExamplesLib = '<mxlibrary>[{"xml":"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","w":880,"h":675,"aspect":"fixed","title":"Example: Fictional FTG+PM"}]</mxlibrary>';

  // Load libraries depending on URL params

  function isArtifact(type) {
    return type === "artifact";
  }
  function isFormalism(type) {
    return type === "formalism";
  }
  function isTransformation(type) {
    return type === "auto_transformation" || type === "man_transformation";
  }
  function isActivityNode(type) {
    return type === "autom_activity" || type === "man_activity" || type === "super_activity";
  }

  const params = new URLSearchParams(window.location.search); // breaks Electron version
  const version = params.get('ftgpm-version');
  if (version === 'ports' || !version) {

    ui.editor.graph.addListener(mxEvent.CELL_CONNECTED, (_, eventObj) => {
      // This will change the edge style WITHIN the transaction of the edit operation.
      // The terminal-change and style-change will be one edit operation from point of view of undo manager.

      function isControlFlowPort(type) {
        return type === "ctrl_in" || type === "ctrl_out";
      }
      function isDataPort(type) {
        return type === "data_in" || type === "data_out";
      }
      function isControlFlowNode(type) {
        return isControlFlowPort(type) || type === "initial" || type === "final" || type === "fork_join";
      }
      function isDataFlowNode(type) {
        return isDataPort(type) || isArtifact(type);
      }

      const fromTo = [
        // PM control flow
        [ isControlFlowNode, isControlFlowNode, "control_flow" ],

        // PM data flow
        [ isDataFlowNode, isDataFlowNode, "data_flow" ],

        // FTG data flow
        [ isTransformation, isFormalism, "data_flow" ],
        [ isFormalism, isTransformation, "data_flow" ],

        // typed-by links:
        [ type => type === "man_activity", type => type === "man_transformation", "typed_by" ],
        [ type => type === "autom_activity", type => type === "auto_transformation", "typed_by" ],
        [ type => type === "super_activity", isTransformation, "typed_by" ], // super activity can be typed by auto or manual transformation.
        [ isArtifact, isFormalism, "typed_by" ],
      ];

      checkEdge(ui, eventObj.properties.edge, fromTo);
    });

    ui.loadLibrary(new LocalLibrary(ui, portsExamplesLib, "FTG+PM with ports: Examples"));
    ui.loadLibrary(new LocalLibrary(ui, portsPrimitivesLib, "FTG+PM with ports: Primitives"));    

    console.log("Activated FTG+PM with ports")
  }

  if (version === 'noports' || !version) {
    ui.editor.graph.addListener(mxEvent.CELL_CONNECTED, (_, eventObj) => {
      function isControlFlowNode(type) {
        return type === "initial" || type === "final" || type === "fork_join" || type === "decision" || isActivityNode(type);
      }

      const fromTo = [
        // PM control flow
        [ isControlFlowNode, isControlFlowNode, "control_flow" ],

        // PM data flow
        [ isActivityNode, isArtifact, "data_flow" ],
        [ isArtifact, isActivityNode, "data_flow" ],

        // FTG data flow
        [ isTransformation, isFormalism, "data_flow" ],
        [ isFormalism, isTransformation, "data_flow" ],

        // typed-by links:
        [ type => type === "man_activity", type => type === "man_transformation", "typed_by"],
        [ type => type === "autom_activity", type => type === "auto_transformation", "typed_by"],
        [ type => type === "super_activity", isTransformation, "typed_by" ], // super activity can be typed by auto or manual transformation.
        [ isArtifact, isFormalism, "typed_by"],
      ];

      checkEdge(ui, eventObj.properties.edge, fromTo);
    });

    ui.loadLibrary(new LocalLibrary(ui, noportsExamplesLib, "FTG+PM: Examples"));
    ui.loadLibrary(new LocalLibrary(ui, noportsPrimitivesLib, "FTG+PM: Primitives"));

    console.log("Activated FTG+PM without ports")
  }
});
