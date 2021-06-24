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
    data_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;fillColor=#d5e8d4;strokeColor=#6D9656;dashed=1;"),
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

  const noportsPrimitivesLib = '<mxlibrary>[{"xml":"dVNbc6owEP41zPS8AalKH+VmsRZrRT3y0gkQDRIIJ4Trr29APK0z7UMme/t2s7tfJGCkzYLBHL/SCBEJWBIwGKX8KqWNgQiRVDmOJGBKqiqLI6n2L15l8Mo5ZCjjPwBocEEhFxEEBn0xc3BOMpgicY3g9J0SdPXBktMPzmBWnChLIY9pNgYRGCJMSYRYcVd6SDUY5gIrICjyfsDfHqz26n0vBW9v5QsM814sOMrCmDxcfDswC+dsWfu/dSe6Moyk258O8xnZJUvX0XMQyNq/NGl03TUmmd3iWbIBlyT3Y+N1WzgVXllejqy1pOr7VVIXYCMkpQ7D4w6TiQp86tj6TFvSpX+Ww7CsmuXUTGoNPOqgiqzp9uX5fUZN7ex4ESzbdSkWpeqIXDrFcj12XJXUtY/Q4U/Qnr/4zSk6iGe+tamCqo1ynB48Gj1XwVuhL/aQu3mn0YOzu4gk9vqQa/VRdPtHAnqNY462uRiyMNSCHsKGedqvTBEiQ0XcwWCYk9zrlEP+TT/FhBiUUDbMEdi2YT0JCugp4tCKYj6mue6iQoyj5lcCKd9WtEBUpGCtCKnjiONrxOOVYzJG8Rnzexsc6XH+j/xioxDGrd/UkZ839esfDKF33+QT","w":40,"h":40,"aspect":"fixed","title":"FTG: Automated transformation"},{"xml":"dVPbkqIwEP0aqnbfgIzKPg43B0dxHFFXXrYCRAMEwoZw8+s3XNwZq2aKStGX053uPh0JGFm7ZLDAGxohIgFLAgajlI9S1hqIEEmV40gCpqSqsjiSan/jVQavXECGcv5FAA0SFHKBIDDoLzMH5yyHGRK/KTh7pwSNvgzmfziDeXmhLIM8pvmIGQIGxAbmFSTeF5iCwBBhSiLEyofq7sWqvfrYR8m7+9UlhkUvlhzlYUx+JL4dmKVztazj7+YmOjKM9Ha8nJ4X5JCuXEcvQCBrf7O01XXXmOV2hxfpDiRp4cfGZl86NV5bXoGsraTqx3XalGAnJKUJw/MBk5kKfOrY+kJb0ZV/lcOwqtvV3EwbDTzpoI6s+f715X1BTe3qeBGsum0lSFJ1RJKbYrkeO68r6tpn6PBf0H5+9dtLdBJlvnWZguqdcp6fPBq91MFbqS+PkLvFTaMn55CIJPb2VGjNWXT7UwJ6g2OO9oWYnjA0YjWEDfOsp0sRIkNlfIPBMCe51ymH/JN+iQkxKKFsmCOw5v0n7Bni0IpiPqUZuagR46j9dnmUTxQtERUpWCcgTRxxPCKexv2SMYqvmD/a4MT79X/kxyYKYWL9rk67eVc/3sAAfXgi/wA=","w":40,"h":40,"aspect":"fixed","title":"FTG: Manual transformation"},{"xml":"dVNtc6IwEP41zNx9A1KV+1giWKzVtr6dfrkJEA0SSC6JgP76W0GvdabNTCb78myyu8/GQrhoRopI9iJSyi0UWAgrIUwnFQ2mnFuunaUWGlqua8O23PAbr9N6bUkULc0XASI+0MQAgpP48tiwdfZKUlA4rsHFu+C08yWikH+MIqXeCVUQk4myA7URLQQDROjM0MUXMMlJQpngKVX6LsNbwu5Fva9Fm9Ptec2IvIja0DLJ+I/DNoyHOtoHwep3fYaqMM7Pq936ccCX+Xga+RLFtve3yBvfn+JeGZ7YIH9Dh1xuM/wy11HFJsFC0mBmuf5qktcavYHk1EmyWTLec9FWRKE/8MZivN3bSXKsmnF/mNceevBRlQb9+fPT+0AMvX20SMnxNDsCUa5P+eHsBNOF2kyOYhpuSGR+kfDxedvs0jWk+XoqHFq9OZv+eiHSpyp+1f5oRcxUnj2xjpYHuCScraVXb6DanxbyawYdnUvoHhhqGA+wMVNcKHNAVFRnZxK3fbIvujDEfNILakiQZuYK32WcY8GFatuKQlgYg73joqLK0ObbAXI+UTSiAq5WJ4DUWWpYh3joZsxmNNszc28jV973/yM/phGEK+s39TqfN/XjH7TQu2/yDw==","w":40,"h":40,"aspect":"fixed","title":"FTG: Composite transformation"},{"xml":"dVJNb8IwDP01ufdjIHZt+ThxGZN2Do1pMpK4SsIK+/Vz0xSoNJAq7Pee4xfHrKzNded4J/coQLNyw8raIYYxMtcatGZFpgQr16woMvpYsX3B5pHNOu7Ahn8K8PgNTSCF5seh2TqSC8sN0F8qNh+oYeRO6AzXypuRirpIbOdEp3kDErUA52dOJmPFkM49+3Cb2ji8WAGDNGNl1UsV4NDRiQT0NBrCZDCD3ZxCL7nAPmlbzb1PsQ8Oz/ClRJBJelJa16jRxTalWMBKvA042vCEZ/FHON2otYQ1ND1wSXhIPgdBHFvFm3MbLU9nWLSkqBo0qklKfgno1e9U6Ok6yraf2M2BCkNAM8coW1LmgOr5MfbO79d7sr1cvy8Xg9JA4BuhQhKOk/8BF+D6ci3ypwfZAdIR7kaSPk2P2NW4OZkE1cpUVSaMp1du75WPHaMgvfGUpq2b0sd2R+ls+f8A","w":80,"h":30,"aspect":"fixed","title":"FTG: Formalism"},{"xml":"dVJdk5owFP01zLRvfFitjxBQtyxV2WrVtyCBBALBJID66zfA0tWZ7gPDPfeckzv3Q7NAcV1yWOGAxYhqlqdZgDMmh6i4AkSpZuok1ixXM01dfZq5+II1elavIEel/I+BRRk6S6WgMOqKuT3ZW4qQUTRkSEkkgXQgxqd73XNVIW+jRWBYdaGQqDwT+i0+LUJXvKSeF27au6oPwO6+RzdbCJI7dpX9NfUaJzmutll0Qn/A6bAlCnoO8NfLn47EM+9XdYH7pKbT3HZfrB0K/IvIq7B7zU0Jb5w6DcKgjX4cYsA10zms4ybNm8NmYUfG6+ptJc7babIV02b6e75e7ZUkDmo9cwN7k852Rz2LDDN/bQJrpqi6nKhGFseTn/rLWViIVQ2OKu/48qJ+k+CS2Kp797tmOS0mEr1V8Ny13KrlqRyWRTdQQ4UJoRQwyng/G0vXJ2A+V3khOcvRyJSsVHaHI0HuMOoHqSuMYiIfIGcSPuJhKQ3iEl2/3LnxsKslYgWS/KYkLYklHhTWcBY6RiTF8jkHxYDTf87PA1LBx/pH+HFSI/w83V76dNnv","w":30,"h":30,"aspect":"fixed","title":"PM: Initial"},{"xml":"dVNrr6IwEP01JHe/8bgS+CjPgMAqZlH5VrA8vIViWwTvr98KuleTNSnJnDlzOmTmVFDMZnQJ6KoQHyESFFtQTIIxm6NmNCFCgizWR0GxBFkW+SfIzhtWmlixAwS27D8CnJ1gzngFAtmtmTWRk6SJMYJzpqhbgOb04+Kp6rUnZdeHgFagu4WUwTav0UeRBIFFvdJeX8Flu7ahlSb8H9T1luzGFV46oaprgbHR9YPte2kJXCVBy8hRJW/wW5Nuot+WNjoX6HWD1HPlobymwap1MxYKssGPRUsjknBcb/7AEvvOPi8T5dRkse2p4igeXKrF1OGFq7BfI7q4+KPeyAt+1VklktS7huZHMRg7XW1xv08X39FCkwID5dsyPlu70Ki4+FMHqXTiwT7CyeBnSbJMhzb1oqI4ayKjvbLZRS3n7aoozV+CYgxVzeC2A/ltHANfK89VrLmNWuJhUSNkYoTJNDdFFD9NXed5ygj+gu+ZXX1kFWf4DgwCaf0Nsmn2IsfwWLMnSDADz3je4wUSBse3JpGe1utC3EBGrrxkuLflrDL7SKxgXVbsNQfojMt/yh/H8eDumAe8e/ABf7w+lb48hb8=","w":30,"h":30,"aspect":"fixed","title":"PM: Final"},{"xml":"dVI9c8IwDP01XntO0gyMJbRMXcrQsWdiQQyOlXPUAv31lRynlLsy+E567+nbqmr68zqaoXtFC15Vz6pqIiJNVn9uwHtVamdVtVJlqfmp8uUOWyRWDyZCoH8CcHuAlljhzVaKrRKZQvo39DAhO4zHjwO6MFFz8qS8rTvSZQ6K+BksiFSrannqHMFmMK2wJx6PsY56KVmwucNAG/ctZCHykSIe4d1Z6hgqReG8b9BjTNkrrR+bxYJx490+MNbygMDk8gsiudb4p0z0zlrpKeeccwQMAg48FY2Ss16qesUIWEdmm6aQTqaRJSmc7+60+LOJNWAPFC8sOeX+RaH1Qz0FduD2XQ7M19BmnPz9b/D1Rmzk/c5uvtrsXn9Hkt58nh8=","w":100.5,"h":20,"aspect":"fixed","title":"PM: Fork/join"},{"xml":"dVNLk6IwEP41VO3eAkHQo/ISkXUHVGa98YgQBeIkGUF+/QTQmbFq5wDV36Pp0N2RoFG1Do0vhU8yVErQkqBBCeFjVLUGKktJATiToCkpChCPpNg/qPKggktMUc3/k0CSE0q5cJRx0hczB3FIqQJSopHJUIoZJvWoPL49GJ/LMn575LAivvQh46hOcfmrPqy4ydzcdA9/GygpCwvN590s0N3NGTlsbmj6MbmxUNHMw+ZgrdZKEsy8CLysI92PLN+SSZVZt7l9OsJ3PZqdfM4WWVrGuOi8Cd1utHyn7ZL8xd3/84P12wnkV3PVqoFpaNp+modFuQcE212nEthOKh3sJq+Uem0Uv/hJg0O4tkPdwsmE7MXpChdCDSxt1qxMHxy9q2jZbeGSreqmjdCXiXi5qH3zPCepltPddP/qkLUS52qx6//PDkKrdM4i+JPP22wb1ZoFqBPI198SXDQF5ii8xGnfokZMW3AFr/oJyCKk5L3OUN9nINCR1DzEXW+Ve8w4JWdkkJJQQdWkRp9khDNeCFLp03BZPkySAgFQjdlM8CjDPE6GOYGhFo+fMGK4+4bHoV8R5aj9cankb7vgIFIhTm/C0tyPI1R13DtQIJwX/JmL2Yjzz8yvDRXBfb0e8L6zD/h1Nwbr09X5AA==","w":40,"h":40,"aspect":"fixed","title":"PM: Decision/merge"},{"xml":"dVPbjpwwDP2avFYMiFH3cWFn9qVVpd2V+lgZ4oF0Q0xDmEu/vs6FYWbVRaDgc45jO45FUQ/nZwtj/50kalHsRFFbIhf/hnONWos8U1IUTyLPM/5Evv+E3QQ2G8Gicf9xoOY3to4VGhof7CmQW83a6kDGMy1psoHZ/pl9GpXIiyw8t9C2S2vwnVegNDAgLwvV2CtXPAqfTuku462Cs5s/bshYzGeBQ1nDC2mMWcPsaPgFrVNH5S6RD5FXFhzKD4oQOSgeF8WbBTMdyLKhyKRAGlrsSUu0093BLuece/O+BZO7LLlZmo1EL91w7qdeOXwdeUcGTtxpxno36ERPztI7/lTS9QnxhdfXLhSH8DDeMg7KoE067pSGcVJNiJsxIi2Nb2A7dEkCtn1Vfz39la2RlHGhoLLil1tRZ19KUXKUmu3NavNbVIa+pVvi9z4orW+y2u/r3QPfqspiO9tJHfEFpxjKq/E8gpHJaKB978Kh/Jid5goSzgUZvo4QC/D5DuhgJ9WSfjz0I1qH508v+OamF89IvIXlbmendKJe8ZBHtx5V1ye3bRyMDFKHu6vrOi78k/q7mGmAFnMd1CC9m+N/","w":192,"h":60,"aspect":"fixed","title":"PM: Automated activity"},{"xml":"dVPfb5wwDP5rIm0vFQfitD0O7tqXVZPaSnucDPgga0iYMfdjf/2cEMpdtULuiP19cezPicrK/vxAMHSPrkGjsr3KSnKO51l/LtEYlSa6UdlOpWkiP5Xef4BuApoMQGj5Pwtc9RtrFoaBym+2C+DWCLeYxD3yxWBwb/9MPoeidsaRyr4JSG31SaLJKOX/avZ5pcusnb+5hR7ls4Sv6A0L0QTiy3DNkCyndX2oo39yMZ+0B/sLatZHzZcZDRss2ATmHRyiB/gxwC8Edjw46oG1s3EDAzV2zjRI442Ci6CpN2+1XjVKyU22QU/dSM6nTjM+DxJRHCdpqfg67k2ERyb3ij91w130HJzlctZXomWH8ATNLYO2SJEnPTAwjLoK+ybiacgNL0AtcqQA1c/6r4e/iDU4bTkUlBcyfJ+Su1zlO9+wvNistoyssO57PA4+NmE90aiP+ITjHNJ78TyAbaJx0MZcJb7f+tf3GOrXNojyY2IjFUS+FGTl3MFcgM+3R4Z9o5f0Z9GPSIznD0/y5qoXD+gkBEmrk1NU1DO+zqc96VC3XVy2jT6IHW7flq73Qiaxv4sZb8pirjcyUG8u7D8=","w":190,"h":60,"aspect":"fixed","title":"PM: Manual activity"},{"xml":"dVPbbtswDP0avdvW0j437mUvQ4GkwB4HRmZstbJkSMxtXz/q4tTZVgOJzcPDQ4qkhGzH84uHafjhOjRCPgnZeucof43nFo0RTaU7IR9F01T8E83zF946easJPFr6T4DbvaMiZhjYxWSPybmyMCK/GBfyIf43K7pMGUp648YZzHTlxukXKNJHTZfsTuFXpwua8C9GUkuMdma8ebBh7/wIpJ0teQwoHJzp0IebA83na6J5e/RAl7k07w62w0ithVyfBs6ynViRgRN3mLGBRlPcgbz7wJ+6o6Ege21M64zzSU0+89O2jCtnCbRFX3hH9KQVmAeje8sYuSi9Z9a21PKt2Au1Kj2MQ4lSPKEoufaoDj7oI24w6N8xPNLwPIHtisEVWJ4b7JJ6nRBjYAo6I5EzIsFTp6kQwKttVrtnawfqo0/teT2Q4bOUIJ9SLpuQkEWizPiOuh+oBOWRxC7g+cu1qxeTekHH1XnehepUUrFXyrscNsziccD3eV8rKAvQX2OvcpvYCttziU1VCribwy7Zns1FunpV/ZtOrm6zgeGZWCBcx16F5dXhj8VJPqG0hrNZ7tdsft7jHL285n8A","w":336,"h":270,"aspect":"fixed","title":"PM: Composite activity"},{"xml":"dVLLcsMgDPwa7n7UmfbYOG1OvTSd6ZkYxdBg5MFKnfTrKzDOYyY5GEurlbQIibLujmsve/2BCqwo30RZe0SarO5Yg7WiyIwS5UoURcafKN4fRPMYzXrpwdGdBNz+QEPMsHIbmq1isHKyA/4xLsrXcBYVnfoJivW6T7Qw0aUns5OhSIxY2YBGq8APNxJiyTsJsW7Ev2KH4kp9Edzbiw10mht7PDgFgcoql6M2BJueuzMw8vwY09SFO+VsDloqHBO3tXIYkj2Qxz18G0U6UXfG2hot+timVBU8qyfGpTWtY6zhUYIPRHS0SXoCIc5wKZt9G6XNNRw6Ziwb7EyTmsoD4WD+YNbAso1r2Vuw54FDchvL5meFV4oWq5dFFZgdkHxThhJxGt4veILjw+fPr2a6BuQS/sSUMQ0gMLJpRTINptUprUyYTK/anlMvy8RGeqfZTes1u5c1jtSbLf8H","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact"},{"xml":"dVLNToQwEH6aXk1L0Q1Hl9U9mRj34NF0YRaqhdm0VcGnd6CUhegeSGbm+xvaMpk33d6qc/2EJRgmH5jMLaIPVdPlYAxLuC6Z3LEk4fSx5PEKKkaUn5WF1v8jwOM7FJ4YRh2HsN0IjpLmBQ2ESYGtt2jeTga/Axr9R/I62vk+6qCs4DC1nMkttOW9teQhd4VRzumChrVvhmBBpaOUD3jVpa9pQsbbEyUf9M9gIPjMyNGgHSMk52meZYSEvYbEq38uFsvuARvwtieKBaO8/lrrlAttNfNm6TPqdjiyPjBSvlY4/LQFTKTl1URdF3U3nMvbJEuF2Nylm7WLV7YC/8eFisXul9F49rGdLjW2l8cT1Mu39Qs=","w":40.003529411764895,"h":40,"aspect":"fixed","title":"PM: Control flow"},{"xml":"dVJLb4MwDP41uQOhaDtusPU0aVoPO04pcSFdwFXibbBfv5AESrU2UiT7e9h5mPGyG7ZGnNoXlKAZf2K8NIgUom4oQWuWJUoyXrEsS9xm2fMNNvVschIGerpiwP0RanIKLfZTs8qT3tK9oYaASEHi46DxJ1Bzca+87GtpnE0gG9jFNGH8EXr5YIyrwataC2tV7cCWuqlr6kJLBj/hXUlqI3LAnnbqdyqQ5jEvUaPxDXji14QrrVe43MCdzJeKK6ao7otN4RgpbAsytgmXmo57883S1U23gB2QGZ3EgBakvi99woa0WXSL9RVVPz32GBR5cumw+GVqiKL1p86+4bqPhGmA/vlcsDrtGfJfNadxAOb0PGjBvZ7DPw==","w":40,"h":40,"aspect":"fixed","title":"Data flow"},{"xml":"dVJNb4MwDP01uQeodt/o2tOkqp204xSIV7KGGAVvg/365YsCWhspkt+zn+3YYUXZDnsruuYFJWhWPLOitIgUrXYoQWuWcyVZsWV5zt1l+e6ONwte3gkLhm4IsPqEmlyEFpUvtg3OIGmPqCEyNHYg36sxeqbcIXBdtqdx0oA8wylBzoonMPLRWvxxsNJYX14bZRzdUOvLZs7syeIF3pSkJjEfaOikfn2KbJNwiRptKFHwcBwvRd+ATCIPDoIIrAlMzufkC/FDOLGxndJTEw6lit4XH+yfcnec2WIKe8AWyLo5cQtakPpe60Qf4fkad5UeUBm/hzFGbPha0eOXrSEFLfc96YbbOhL2DPRP54xFtzMV1jjB9DcmOP/BqF5+0T8=","w":40,"h":40,"aspect":"fixed","title":"Typed-by"}]</mxlibrary>';

  const noportsExamplesLib = '<mxlibrary>[{"xml":"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","w":720,"h":554,"aspect":"fixed","title":"Example: Fictional FTG+PM"}]</mxlibrary>';

  const portsPrimitivesLib = '<mxlibrary>[{"xml":"dVNbc6owEP41zPS8AalKH+VmsRZrRT3y0gkQDRIIJ4Trr29APK0z7UMme/t2s7tfJGCkzYLBHL/SCBEJWBIwGKX8KqWNgQiRVDmOJGBKqiqLI6n2L15l8Mo5ZCjjPwBocEEhFxEEBn0xc3BOMpgicY3g9J0SdPXBktMPzmBWnChLIY9pNgYRGCJMSYRYcVd6SDUY5gIrICjyfsDfHqz26n0vBW9v5QsM814sOMrCmDxcfDswC+dsWfu/dSe6Moyk258O8xnZJUvX0XMQyNq/NGl03TUmmd3iWbIBlyT3Y+N1WzgVXllejqy1pOr7VVIXYCMkpQ7D4w6TiQp86tj6TFvSpX+Ww7CsmuXUTGoNPOqgiqzp9uX5fUZN7ex4ESzbdSkWpeqIXDrFcj12XJXUtY/Q4U/Qnr/4zSk6iGe+tamCqo1ynB48Gj1XwVuhL/aQu3mn0YOzu4gk9vqQa/VRdPtHAnqNY462uRiyMNSCHsKGedqvTBEiQ0XcwWCYk9zrlEP+TT/FhBiUUDbMEdi2YT0JCugp4tCKYj6mue6iQoyj5lcCKd9WtEBUpGCtCKnjiONrxOOVYzJG8Rnzexsc6XH+j/xioxDGrd/UkZ839esfDKF33+QT","w":40,"h":40,"aspect":"fixed","title":"FTG: Automated transformation"},{"xml":"dVPbkqIwEP0aqnbfgIzKPg43B0dxHFFXXrYCRAMEwoZw8+s3XNwZq2aKStGX053uPh0JGFm7ZLDAGxohIgFLAgajlI9S1hqIEEmV40gCpqSqsjiSan/jVQavXECGcv5FAA0SFHKBIDDoLzMH5yyHGRK/KTh7pwSNvgzmfziDeXmhLIM8pvmIGQIGxAbmFSTeF5iCwBBhSiLEyofq7sWqvfrYR8m7+9UlhkUvlhzlYUx+JL4dmKVztazj7+YmOjKM9Ha8nJ4X5JCuXEcvQCBrf7O01XXXmOV2hxfpDiRp4cfGZl86NV5bXoGsraTqx3XalGAnJKUJw/MBk5kKfOrY+kJb0ZV/lcOwqtvV3EwbDTzpoI6s+f715X1BTe3qeBGsum0lSFJ1RJKbYrkeO68r6tpn6PBf0H5+9dtLdBJlvnWZguqdcp6fPBq91MFbqS+PkLvFTaMn55CIJPb2VGjNWXT7UwJ6g2OO9oWYnjA0YjWEDfOsp0sRIkNlfIPBMCe51ymH/JN+iQkxKKFsmCOw5v0n7Bni0IpiPqUZuagR46j9dnmUTxQtERUpWCcgTRxxPCKexv2SMYqvmD/a4MT79X/kxyYKYWL9rk67eVc/3sAAfXgi/wA=","w":40,"h":40,"aspect":"fixed","title":"FTG: Manual transformation"},{"xml":"dVNtc6IwEP41zNx9A1KV+1giWKzVtr6dfrkJEA0SSC6JgP76W0GvdabNTCb78myyu8/GQrhoRopI9iJSyi0UWAgrIUwnFQ2mnFuunaUWGlqua8O23PAbr9N6bUkULc0XASI+0MQAgpP48tiwdfZKUlA4rsHFu+C08yWikH+MIqXeCVUQk4myA7URLQQDROjM0MUXMMlJQpngKVX6LsNbwu5Fva9Fm9Ptec2IvIja0DLJ+I/DNoyHOtoHwep3fYaqMM7Pq936ccCX+Xga+RLFtve3yBvfn+JeGZ7YIH9Dh1xuM/wy11HFJsFC0mBmuf5qktcavYHk1EmyWTLec9FWRKE/8MZivN3bSXKsmnF/mNceevBRlQb9+fPT+0AMvX20SMnxNDsCUa5P+eHsBNOF2kyOYhpuSGR+kfDxedvs0jWk+XoqHFq9OZv+eiHSpyp+1f5oRcxUnj2xjpYHuCScraVXb6DanxbyawYdnUvoHhhqGA+wMVNcKHNAVFRnZxK3fbIvujDEfNILakiQZuYK32WcY8GFatuKQlgYg73joqLK0ObbAXI+UTSiAq5WJ4DUWWpYh3joZsxmNNszc28jV973/yM/phGEK+s39TqfN/XjH7TQu2/yDw==","w":40,"h":40,"aspect":"fixed","title":"FTG: Composite transformation"},{"xml":"dVJNb8IwDP01ufdjIHZt+ThxGZN2Do1pMpK4SsIK+/Vz0xSoNJAq7Pee4xfHrKzNded4J/coQLNyw8raIYYxMtcatGZFpgQr16woMvpYsX3B5pHNOu7Ahn8K8PgNTSCF5seh2TqSC8sN0F8qNh+oYeRO6AzXypuRirpIbOdEp3kDErUA52dOJmPFkM49+3Cb2ji8WAGDNGNl1UsV4NDRiQT0NBrCZDCD3ZxCL7nAPmlbzb1PsQ8Oz/ClRJBJelJa16jRxTalWMBKvA042vCEZ/FHON2otYQ1ND1wSXhIPgdBHFvFm3MbLU9nWLSkqBo0qklKfgno1e9U6Ok6yraf2M2BCkNAM8coW1LmgOr5MfbO79d7sr1cvy8Xg9JA4BuhQhKOk/8BF+D6ci3ypwfZAdIR7kaSPk2P2NW4OZkE1cpUVSaMp1du75WPHaMgvfGUpq2b0sd2R+ls+f8A","w":80,"h":30,"aspect":"fixed","title":"FTG: Formalism"},{"xml":"dVJdk5owFP01zLRvfFitjxBQtyxV2WrVtyCBBALBJID66zfA0tWZ7gPDPfeckzv3Q7NAcV1yWOGAxYhqlqdZgDMmh6i4AkSpZuok1ixXM01dfZq5+II1elavIEel/I+BRRk6S6WgMOqKuT3ZW4qQUTRkSEkkgXQgxqd73XNVIW+jRWBYdaGQqDwT+i0+LUJXvKSeF27au6oPwO6+RzdbCJI7dpX9NfUaJzmutll0Qn/A6bAlCnoO8NfLn47EM+9XdYH7pKbT3HZfrB0K/IvIq7B7zU0Jb5w6DcKgjX4cYsA10zms4ybNm8NmYUfG6+ptJc7babIV02b6e75e7ZUkDmo9cwN7k852Rz2LDDN/bQJrpqi6nKhGFseTn/rLWViIVQ2OKu/48qJ+k+CS2Kp797tmOS0mEr1V8Ny13KrlqRyWRTdQQ4UJoRQwyng/G0vXJ2A+V3khOcvRyJSsVHaHI0HuMOoHqSuMYiIfIGcSPuJhKQ3iEl2/3LnxsKslYgWS/KYkLYklHhTWcBY6RiTF8jkHxYDTf87PA1LBx/pH+HFSI/w83V76dNnv","w":30,"h":30,"aspect":"fixed","title":"PM: Initial"},{"xml":"dVNrr6IwEP01JHe/8bgS+CjPgMAqZlH5VrA8vIViWwTvr98KuleTNSnJnDlzOmTmVFDMZnQJ6KoQHyESFFtQTIIxm6NmNCFCgizWR0GxBFkW+SfIzhtWmlixAwS27D8CnJ1gzngFAtmtmTWRk6SJMYJzpqhbgOb04+Kp6rUnZdeHgFagu4WUwTav0UeRBIFFvdJeX8Flu7ahlSb8H9T1luzGFV46oaprgbHR9YPte2kJXCVBy8hRJW/wW5Nuot+WNjoX6HWD1HPlobymwap1MxYKssGPRUsjknBcb/7AEvvOPi8T5dRkse2p4igeXKrF1OGFq7BfI7q4+KPeyAt+1VklktS7huZHMRg7XW1xv08X39FCkwID5dsyPlu70Ki4+FMHqXTiwT7CyeBnSbJMhzb1oqI4ayKjvbLZRS3n7aoozV+CYgxVzeC2A/ltHANfK89VrLmNWuJhUSNkYoTJNDdFFD9NXed5ygj+gu+ZXX1kFWf4DgwCaf0Nsmn2IsfwWLMnSDADz3je4wUSBse3JpGe1utC3EBGrrxkuLflrDL7SKxgXVbsNQfojMt/yh/H8eDumAe8e/ABf7w+lb48hb8=","w":30,"h":30,"aspect":"fixed","title":"PM: Final"},{"xml":"dVI9c8IwDP01XntO0gyMJbRMXcrQsWdiQQyOlXPUAv31lRynlLsy+E567+nbqmr68zqaoXtFC15Vz6pqIiJNVn9uwHtVamdVtVJlqfmp8uUOWyRWDyZCoH8CcHuAlljhzVaKrRKZQvo39DAhO4zHjwO6MFFz8qS8rTvSZQ6K+BksiFSrannqHMFmMK2wJx6PsY56KVmwucNAG/ctZCHykSIe4d1Z6hgqReG8b9BjTNkrrR+bxYJx490+MNbygMDk8gsiudb4p0z0zlrpKeeccwQMAg48FY2Ss16qesUIWEdmm6aQTqaRJSmc7+60+LOJNWAPFC8sOeX+RaH1Qz0FduD2XQ7M19BmnPz9b/D1Rmzk/c5uvtrsXn9Hkt58nh8=","w":100.5,"h":20,"aspect":"fixed","title":"PM: Fork/join"},{"xml":"dVNNj5wwDP01uVYMiFH3uLAze2lVaXelHqtAPJBuiKkJ89FfXyckw8yqi0DB7z3HdhyLoh7OzyTH/jsqMKLYiaImRLf8DecajBF5ppUonkSeZ/yJfP8JuwlsNkoC6/7jgM1vaB0rjGx8sKdAbg1rqwNaz7RokAKz/TP7NCqRF1l4bqFtF9fgO69AaeUAvCSqoStXPAqfTuku462Cs5s/bsjYkk+CQ1nDCxpYspazw+GXbJ0+andZ+BB5ZaUD9UERIgfFY1K8kbTTAYkNjTYGMrKFHo0Cmu4ONp1z7s37FkzuknIjnK0CL91w7qdeO3gdeUcGTtxpxno3mEhPjvAdfmrl+oj4wutrF4pDeBhvGZfaAkUdd8rIcdJNiJsxogjHN0kduCiR1L7qv57+ytaI2rpQUFnxy62osy+lKDlKzfZmtfktKovf4i3xex+0MTdZ7ff17oFvVUXQzjTpI7zAtITyajiP0qpoNLJ978Kh/Jid4QoizgVZvo5yKcDnO4CTO6VT+suhH4EcnD+94JubXjwD8hbE3c5O8UR9tx7Kxa0H3fXJLU5GJmOLu6vvOi/8ExuczDhByVwnNUjvBvkf","w":295,"h":120,"aspect":"fixed","title":"PM: Automated activity"},{"xml":"dVPfb5wwDP5rIm0vFQfitD0O7tqXVZPaSnucDPgga0iYMfdjf/2cEMpdtULuiP3Zju0vVlnZnx8Ihu7RNWhUtldZSc7xvOvPJRqj0kQ3KtupNE3kp9L7D9BNQJMBCC3/x8FVv7FmsTBQ+cN2AdwasS0mUY98MRjU2z+Tz6GonXGksm8CUlt9kmiySvm/2n1ezWXXzt/cQo/yWcJX9IaFaALxZbi2kCyn1T/U0T+5mE/ag/0FNeuj5suMhgMWbALzDg7RA/wY4BcCOx4c9cDa2XiAgRo7Zxqk8aaDS0NTL972eu1RSm6yDXrTjeR86jTj8yARRXESSkXXcW8iPDK5V/ypG+6i5uAsl3N/JVp2CE/ouWXQFinaCQcGhlFX4dxENA254QWoRY4mQPWz/uvhLyINTlsOBeWFLM9TcperfOcJy4vNKsvKCuu+x+vgYxPWE436iE84ziG9Fs8D2CYKB23MVeL7rX89x1C/tqEpPyY2UkG0l4Ks3DuYC/D59siwb/SS/tz0IxLj+cObvLni4gGdhCChOjnFjnq2vuazW4e67Ra3OAIJRIrbN991MGQTCV7EOCqLuI5kML2Z2H8=","w":295,"h":120,"aspect":"fixed","title":"PM: Manual activity"},{"xml":"dVPbbtswDP0avdvW0j437mUvQ4GkwB4HRmZstbJkSMxtXz/q4tTZVgOJzcPDQ4qkhGzH84uHafjhOjRCPgnZeucof43nFo0RTaU7IR9F01T8E83zF946easJPFr6T4DbvaMiZhjYxWSPybmyMCK/GBfyIf43K7pMGUp648YZzHTlxukXKNJHTZfsTuFXpwua8C9GUkuMdma8ebBh7/wIpJ0teQwoHJzp0IebA83na6J5e/RAl7k07w62w0ithVyfBs6ynViRgRN3mLGBRlPcgbz7wJ+6o6Ege21M64zzSU0+89O2jCtnCbRFX3hH9KQVmAeje8sYuSi9Z9a21PKt2Au1Kj2MQ4lSPKEoufaoDj7oI24w6N8xPNLwPIHtisEVWJ4b7JJ6nRBjYAo6I5EzIsFTp6kQwKttVrtnawfqo0/teT2Q4bOUIJ9SLpuQkEWizPiOuh+oBOWRxC7g+cu1qxeTekHH1XnehepUUrFXyrscNsziccD3eV8rKAvQX2OvcpvYCttziU1VCribwy7Zns1FunpV/ZtOrm6zgeGZWCBcx16F5dXhj8VJPqG0hrNZ7tdsft7jHL285n8A","w":336,"h":270,"aspect":"fixed","title":"PM: Composite activity"},{"xml":"dVLLcsMgDPwa7n7UmfbYOG1OvTSd6ZkYxdBg5MFKnfTrKzDOYyY5GEurlbQIibLujmsve/2BCqwo30RZe0SarO5Yg7WiyIwS5UoURcafKN4fRPMYzXrpwdGdBNz+QEPMsHIbmq1isHKyA/4xLsrXcBYVnfoJivW6T7Qw0aUns5OhSIxY2YBGq8APNxJiyTsJsW7Ev2KH4kp9Edzbiw10mht7PDgFgcoql6M2BJueuzMw8vwY09SFO+VsDloqHBO3tXIYkj2Qxz18G0U6UXfG2hot+timVBU8qyfGpTWtY6zhUYIPRHS0SXoCIc5wKZt9G6XNNRw6Ziwb7EyTmsoD4WD+YNbAso1r2Vuw54FDchvL5meFV4oWq5dFFZgdkHxThhJxGt4veILjw+fPr2a6BuQS/sSUMQ0gMLJpRTINptUprUyYTK/anlMvy8RGeqfZTes1u5c1jtSbLf8H","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact"},{"xml":"nVTbbtswDP0aP3bwZTa6x9ju+tIBRRtgj4NiMbY2WfRkNU729aNk+dalWzHABsjDQ5EiKQZJ0Z7vNeuaL8hBBsldkBQa0YxSey5AyiAOBQ+SMojjkP4g/vyGNXLWsGMalLnigIfvUBliSHawwUpnzCRxcy5OJNZWnKDDa+CIynr35iLBeWc/X3Ay3PTiF6E7Itx258U2HSLUdAzlM560PZ3gPyISdiWx90F9x9SCpR1qo1gLJK5O35L+FvQa8180Vw0KaC7df8d9J9k1XrIKGpQcdL+ZCBffAXuXiSO3T+jbGHNm2DfbIGeYCuVMS9ni1aTFVt0O4TIVscYXxcFSQ8ptaISB545SI2CgWSesMa2dv4hEDTQ47OB8rc41dnumazAeqGhWmFCgZ11K1vVidLER8AT6KHEg9SS8IVf44KfcUuw1ClS90XSUeULDjEA1GUGLFoyLoOmFMFVLeFzAvFes2+MjCvesrAtZ2B0XS46tqOZQRHP1T3P6qP9F+CENUqpMYXWSCXmlR7MeLXz6kpxJutlOaxx6H0BvswdKY1U/qoURFZM7KWpLaQXnriDMAxUth/FW1BOh6gc4TrfyCGnxou2ROlbeZP6dP7tnXkaWfxRSFihRu74nPIVb/tF6Go0/4KvgpvFZjciKm5WfsjSbR9dmDec311i0mrd7QKq+vhBl8BHImo6bLmxA1I3ZYsy/hnr2XHYiCX6EJ9VvyUldtrGjbpb1bw==","w":50,"h":50,"aspect":"fixed","title":"PM: Artifact input port"},{"xml":"nVTfb5wwDP5reOzEj4G6xwO6vnRS1Z60xylHfJAuxCzkjrv99XNCgKO7blUlkOzPn2PHdhwkRXu616xrviEHGSR3QVJoRDNK7akAKYM4FDxIyiCOQ/qD+Osb1shZw45pUOaKA+5eoDLEkGxng5XOmEni5lwcSaytOEG718AelfXuzVmC885+HXAy3PTiN6EbItx2p8U2HYIHM51DCY1HrY8n+K+QhF3J7H1Q3zG1YGmH2ijWAokXp69J/wp6jfk/misHBTTn7sNx30l2nZesggYlB92vRsLFd8DWZeLI7RP6PsacGfbDdchZpko521K3+GLWYquux3CZi1jjQXGw1JCSGxph4Lmj3AgYaNoJa0xrJzAiUQONDts5X6tzjd2W6RqMByoaFiYU6FmXknW9GF1sBDyC3kscSD0Kb8gVPvg5txR7jQJVbzQdZZ7QMCNQTUbQogXjImh6I0zVEh4XMO8V67b4iMI9LOtCFnbHxZJjK6o5FNFcA9KcPhqAIvyUBilVprA6yYS80qNZjxY+fUnOJN1sozUOvQ+g19kDpXFRP6qFERWTGylqS2kF564gzAMVrYfxVtQToeoH2E+38ghp8aJtkTpW3mT+pT+7h15Glr8XUhYoUbu+JzyFW/7ZehqNP+G74KbxWY3IBTcrv2RpNs+uzRpOby6y6GLe7gGp+vpMlMFHIGs67rqwAVE3Zo0x/xzq2XPZiiT4EZ5UvycnddnHjrpa138A","w":50,"h":50,"aspect":"fixed","title":"PM: Artifact output port"},{"xml":"jVTBbtswDP0aHzvYchysx9hJe+mAog2w46DYrK1VFj1ajdN9/ShFtpM0xQokAPkeKT5StKK0aA/3JLvmB1ago3QTpQUh2qPVHgrQOhKxqqJ0HQkR8z8Sd5+wiWfjThIYeyUBd7+htByh5c4VW3tyqTk2r9SezdqZI7S7BF7QuOzevmvw2cs/bzgSN736y+iKA753h5kbD1FmPIb1HE86P53hDxUZuyLsa9BX1SbxNbmRyDoka2QLbP5f+hUBl6i/Gy1LaFBXQP35pbVPGHSK0pL+5ebliVGFp2ZN4uTihXPPd2JuWxC+mQpcaMw6hkZZeO5YBgMDrx5jjW3dOiRsEvBk5M7nOr8i7LaSarABKLl/qQzQ5Gstu14dU1wF3AO9aBzY3atA5AYfwtK5ENdGgaa3xEfZJ7TSKjQjCaRasL4C8cJKU2t4nMG8N7Lb4iMqv+UuhRm5qdSssVXlVIrD/KyznH/8QRTxtyzKeDKF89lm5MJPJj+Z4/mX5lJzZysiHPpQgM7VA8s4mR/PwqpS6pVWtQtpVVX5gcgAlPyt+q7cYj37rVwnwvlK6wI1kr/FdL3YJHeZ694SvsIJE8eL4vbWMXyrytRb5Dtd3yyn2J+qsg1DYlpDpwoOn74ayck+3QPydOmdQ4ZwDrPZ8WGJG1B1E7IWAZNhs+spc36C2AgrOrrhURrd+fHzoWdv4z8=","w":50,"h":40,"aspect":"fixed","title":"PM: Control flow input port"},{"xml":"jVRNb9swDP01Pnaw5ThYj7Gd9rIBRRtgx0GxWVubLHq08tH9+lGKbCdpihVIAPI9UnwiaUVp0R0fSfbtd6xBR+k6SgtCtCerOxagdSRiVUdpGQkR8z8SDx+wiWfjXhIYeyMBt7+gshyh5dYVKz251Byb12rPZuPMEdpeA69oXPZg3zT47OWfHY7E3aD+MrrigK/9cebGQ3Bnx3NY0Omoy+MZfleSsRvKPgd9Vm4S39IbiaxHskZ2wOb/pd8QcI364WhZQYu6Bhoup9Y9Y9ApKkv6p2+YZ0YZnptFibPRC+debsV8b0G4MzW40JiFHFpl4aVnHQwcePkYa23nFiJhk4BbI7c+1/k1Yb+R1IANQMUNkMoATb7Wsh/UKcVVwD3Qq8YDu3sViNzgt7B2LsRdo0AzWOKj7DNaaRWakQRSHVhfgXhlpWk0PM1gPhjZb/AJld9zl8KMXNdq1tipairFYb7ZWc4//iSK+EsWZdyZwvlsM3LlJ5OfzPH8S3Op+WYrIjwMoQBdqgeWcdY/7oVVldQrrRoX0qm69g2RAaj4a/W3cpv14teyTITzldYFaiQ/xbRcrJOHzN3eEv6GMyaOF8X9vWN4qso0G+SZlnfLKfaHqm3LkJj20KmC44fvRnK2T4+A3F1645BDOIfZ7PS0xC2opg1Zi4DJsNrNlDk/QmyEFR3d8CyN7vz8+dCL1/Ef","w":50,"h":40,"aspect":"fixed","title":"PM: Control flow output port"},{"xml":"dVLNToQwEH6aXk1L0Q1Hl9U9mRj34NF0YRaqhdm0VcGnd6CUhegeSGbm+xvaMpk33d6qc/2EJRgmH5jMLaIPVdPlYAxLuC6Z3LEk4fSx5PEKKkaUn5WF1v8jwOM7FJ4YRh2HsN0IjpLmBQ2ESYGtt2jeTga/Axr9R/I62vk+6qCs4DC1nMkttOW9teQhd4VRzumChrVvhmBBpaOUD3jVpa9pQsbbEyUf9M9gIPjMyNGgHSMk52meZYSEvYbEq38uFsvuARvwtieKBaO8/lrrlAttNfNm6TPqdjiyPjBSvlY4/LQFTKTl1URdF3U3nMvbJEuF2Nylm7WLV7YC/8eFisXul9F49rGdLjW2l8cT1Mu39Qs=","w":40.003529411764895,"h":40,"aspect":"fixed","title":"PM: Control flow"},{"xml":"dVJLb4MwDP41uQOhaDtusPU0aVoPO04pcSFdwFXibbBfv5AESrU2UiT7e9h5mPGyG7ZGnNoXlKAZf2K8NIgUom4oQWuWJUoyXrEsS9xm2fMNNvVschIGerpiwP0RanIKLfZTs8qT3tK9oYaASEHi46DxJ1Bzca+87GtpnE0gG9jFNGH8EXr5YIyrwataC2tV7cCWuqlr6kJLBj/hXUlqI3LAnnbqdyqQ5jEvUaPxDXji14QrrVe43MCdzJeKK6ao7otN4RgpbAsytgmXmo57883S1U23gB2QGZ3EgBakvi99woa0WXSL9RVVPz32GBR5cumw+GVqiKL1p86+4bqPhGmA/vlcsDrtGfJfNadxAOb0PGjBvZ7DPw==","w":40,"h":40,"aspect":"fixed","title":"Data flow"},{"xml":"dVJNb4MwDP01uQeodt/o2tOkqp204xSIV7KGGAVvg/365YsCWhspkt+zn+3YYUXZDnsruuYFJWhWPLOitIgUrXYoQWuWcyVZsWV5zt1l+e6ONwte3gkLhm4IsPqEmlyEFpUvtg3OIGmPqCEyNHYg36sxeqbcIXBdtqdx0oA8wylBzoonMPLRWvxxsNJYX14bZRzdUOvLZs7syeIF3pSkJjEfaOikfn2KbJNwiRptKFHwcBwvRd+ATCIPDoIIrAlMzufkC/FDOLGxndJTEw6lit4XH+yfcnec2WIKe8AWyLo5cQtakPpe60Qf4fkad5UeUBm/hzFGbPha0eOXrSEFLfc96YbbOhL2DPRP54xFtzMV1jjB9DcmOP/BqF5+0T8=","w":40,"h":40,"aspect":"fixed","title":"Typed-by"}]</mxlibrary>';

  const portsExamplesLib = '<mxlibrary>[{"xml":"7V1Zd5s6EP41Pqd9aA6LwfZjvKXpTdssbtPkJUcGxSbGiILsxPn1VxKLQQhMbJzFxbe9RQuS0Mx8M9IMoqH25k8nHnCn35EJ7YY6aKg9DyEcXM2fetC2G4pkmQ2131AUifxtKMOcUpmVSi7woIMFN6DxAzQwqWGDMe2szwrZLfNLZMMgB69caN6NV0FJ1DarmO7Wx6voHmhO4FWYlBpqFzrmseehR5Ic28iYjaaWQ7KneE67lcmljz00g9eWiadhzj1y8JX1TJuQm2G6h2zksS5Uif1Ivgn8KTTDm2jiHGAMPYflKNK68cTNOvsFAxtadjQIkgp7ZGVPFv4TPQC5vqHXR4oWJvtPibL+KkwEs0SfP0UDHy08I8xSgywMvAkMyaK2sqSSEzN8AtEcYo/QQPKgDbC1TDcP/CA5ieutqUwuQhJFyZDuBTygOWAOyT8kv6Ee0/8rGuUDlsUziIHm7h0wyKAsHHIJu50Vuh4yFwa8+2vcucD3CScBD1v3gPbJZoG2ymqeBzUveues3nGqmmsDA06RbULPTz15xI9qIT96aOGYMZM8Ti0Mr1zACPJIpG0jKxIWSXDPkPx6PZJvEJYElgO9sN4SkkEbwD62rQnlP4zciJHDsRQxMgjvMggL0Ca7HjQWnk9ofQn9gC0DdnOBY4YJMgKH0A+MWesyy7Ft4PrWOBY+whFgYFo4rAA8I2RylaTGwJhN2PT8XGCbPEt4k8e6TE4Cy0l0FNT4Cq3JFKeYn84CfMqFoBy+Dm9Q1QCipFWQboXJx3AkJKVFedOob5LUJS1fFMLeLulMORPyBHF3emtjd7Im6E7legM2hRyAYZdOpZ+Rv/hBtxZJ3cYU36wluZxgNtlB1pjPoPyVYn/97wJFBV8CTqIy3Xaf1mVRIwSXw2bIqIKW0q2T7EyPJE8wsHJZZUcrS6LhEkBykYdjuNo0dMEA+NxCuEnhHvbsOzpfrCAaRUKLRtjULIlN0mZs4oXQ9JA7ihSJLICkLBwgIp/3NtPFSyss6DroLGQ2WoU+TA85BAhJU/gSYaJxkBMVQs8ivMx68CKJOl9ndn0HuCN0jiwnwgUOgYjCsIy4K1KNzbHWJX+IqPWkI62hkZnp0TS5JjlcWo7T8ro++UMxlDwZMzX8CMjSo4dkGIn54xF7bpkmm5AMGCfNESWrE/rNgTzURLaGJDV7nQ4tIVS1nMmIKoX+Fz2jaZSyCJrUdQkEDSGsqWURU4BgTWk/pkNKqo14GtaCGyk8gSwH9y4Sws0J9tiLyzJmSSzNC4GEp+GAl2SwwGiea8JMIBEnAu13HtG7aM7bLSdh8SUrHZW0V7S92itpC+Oe/UqBQwZP1tZCe7O08tKYRpWMFdUbdIblzJw8KyVr/nBQs4s8RTdwJoKsZAVM6WhZCZN5I6FaEatNgQ9oCui1KVCbAhWaAloxdCnK0XuwBvYOVWiBa6x6CVaxCdsEVq0arGqwek2wStlZnRq59oJchJzORhxKVyrqVFRzU7X8tVv5fktWLoTF9SJulMVJE2BQDifbNU5+fJwMUe4M3kdPFeaECJdFwSSyCta3pgbbZjODlmJ/VL+ja/qOOFqwYy7ATW1PuJn1Djnkae07xpIpsekUik2BC9Gwge9TDsvfBVEE9MnXcJGnT24kPX1bOfoy+wpp31+zkfH96WJqlvbzsVvJ1IBVokIoduuWA3Fdu1nkdkrZ6hpH96DBKh0YQnzNcoUs7ZEtXuJXLhZnkfCmPNHb8YcsZxlEkd6CQzrpXa+mLO2dQ17kdQbl/MNrnZ3ndx5x/CcX8t+LtLk/BSZjTVp3QtkzUi2bXMwxt4nt+YQ3mc1gN94fjdpwEN0kTaliusud2GBdqzddYHjkc3n1O6zNNKuJLH9ZEjlhX0mF5SHV1jEwh4BU7SxQybuGrFQBVFyM06uosnwbRy6OS3kLI2dt2NwkTJ4qjZyWgDVaO7JGvZT/Rzch5Tp64gBW1+9oF7LYFlGaakqdaPrbbkO+QNUUhxQcpqqRRWZIU0zhV9Q1CyEqh9EwFJG9yfiTxFY4pFkpcfVZiNM7hsHwTDQHTm60izGFxuzu74KIcFS4Xiv1aOFFsmxjoItc1uV9QJEuJSJaOAAc6PS/xvuKdFG1spEuzTrS5V8y3MpEusi197i226q02+ScjfLYfay+qaFWLzLfJ1blLDJX0Ofwqvbi1nj1injVSq8zZakOd6nhqzR8OYhDr2Jneo1eNXpVa239m/D16gvFOljvBcF6ZZalSnF4SQ2UHwIoP1CwXh6QRntsbxutd7BmXw2cVUc5KxUGRtXIWSPnjs6KyC8b+WkFvoq3DHvOiRlT/umYMWF063sIGmu23lPQ2IbDjA7Uk9/J8sbbhMbr6dB4rZmKjc/U12Rpp/p6cXVVL6r+lpH6G861+ehYlmTOKAA9BVx7OLNNzAJcfLQqdY46iV873V4w7rAJTqlVGaPPcwkNL78jppbj3yNvHhgrxYbp2tIUnqES81lxYJM/Bcy+9TF0DMv+9HA7HPf908lg8PvP4zN5qF5v9vz7/vq4Zf+afftx2nXVsdT+O589dbs/epozXE1bswv1YebeWr3vV/7pcno2GLlw8LOhdH+fzR599YJcyY+GcfNramuKeotOh91W+xv6djuRDGOxfPqm92ePbbXZVZfmQL/67+tlC/Xbk9ORCRarn3QtpHSh/fAsD36MvJuzBfoxvAGnuAOGx//dPt2b12SY56u5DJcX8o1+PULm1+X43O+e/Ab4h/vcRtenvx5II8Of1277kULw55cZ2bEJmUjnnceyTWBJ8aFufIB/U3QsQfMVtwvLIlxx7NJBIZwgaDuK8X9/p1Ly9GOIY1v+nAeWsscxVXnWQQVv/ZQ+IjL5NhCtsOvbQMG6L5HRRRijeYNfKu7/laFiRGlzKlEQpdsW4Mm+3hjK50waailSimsW3SKmcsMb57VGrEYjxkGZ1fNv/D5bvABtfRCVuM+3tt+XSlRFKvHVjH65Ix/JiV/a3xq95bbJ6s82y8f4qoWLieDZ97WY4HlOfNS4uvUb4R/9rPGdjxoXLVu16jm4StzJ4YFi58NB8EAJego3UN/Z2fElCbr1RvhhEVQXEPTNll2ZL0ioodZZAnsRdjJcL7Uk3rCVJvTTFeTfT8PRyefwaddEJeYSThMts57JdWTxplva4dZPL2iyJAsXQMnlkryLGReHPWVsNqHRxmvrEqTJ0qKZocU18maBiSZ9Ov9+0BMebZ5zbj8BAYRHRVRCAC1DAIZtXyJsO+iZj/0QiakWfYhhi5neSY9svUV3UHokAofUR2XU6vVIjktL4VYnWy5OMhvFXDv7XY3kb+KwL9xs2MUhVYhMYjh6iQck5uLi7cd6Q2fLDR1u4ybvOz4VwGPmlHgtva5utTLouZ/dHZJcfzAskIzk98T+Bw==","w":899.9999999999997,"h":675,"aspect":"fixed","title":"Example: Fictional FTG+PM"}]</mxlibrary>';

  // Load libraries depending on URL params

  function isArtifact(type) {
    return type === "artifact";
  }
  function isFormalism(type) {
    return type === "formalism";
  }
  function isTransformation(type) {
    return type === "auto_transformation" || type === "man_transformation" || type === "comp_transformation";
  }
  function isActivityNode(type) {
    return type === "autom_activity" || type === "man_activity" || type === "comp_activity";
  }

  const typedByLinks = [
    [ type => type === "man_activity", type => type === "man_transformation", "typed_by" ],
    [ type => type === "autom_activity", type => type === "auto_transformation", "typed_by" ],
    [ type => type === "comp_activity", type => type === "comp_transformation", "typed_by" ], // composite activity can be typed by auto or manual transformation.
    [ isArtifact, isFormalism, "typed_by" ],
  ];

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

      ].concat(typedByLinks);

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

      ].concat(typedByLinks);

      checkEdge(ui, eventObj.properties.edge, fromTo);
    });

    ui.loadLibrary(new LocalLibrary(ui, noportsExamplesLib, "FTG+PM: Examples"));
    ui.loadLibrary(new LocalLibrary(ui, noportsPrimitivesLib, "FTG+PM: Primitives"));

    console.log("Activated FTG+PM without ports")
  }
});
