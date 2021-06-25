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
      }
    }
  }

  // Styles for our different edge types
  const styles = {
    control_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=2;fontSize=10;strokeColor=#004C99;"),
    data_flow: parseStyle("edgeStyle=0;endArrow=classic;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;fillColor=#d5e8d4;strokeColor=#6D9656;dashed=1;"),
    typed_by: parseStyle("edgeStyle=0;endArrow=blockThin;html=1;strokeWidth=1;fontSize=14;fontColor=#000000;dashed=1;dashPattern=1 1;strokeColor=#666666;endFill=1;endSize=6;"),
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

  const noportsExamplesLib = '<mxlibrary>[{"xml":"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","w":719.9999999999997,"h":543.9999999999998,"aspect":"fixed","title":"Example: Fictional FTG+PM"}]</mxlibrary>';

  const portsPrimitivesLib = '<mxlibrary>[{"xml":"dVNbc6owEP41zPS8AalKH+VmsRZrRT3y0gkQDRIIJ4Trr29APK0z7UMme/t2s7tfJGCkzYLBHL/SCBEJWBIwGKX8KqWNgQiRVDmOJGBKqiqLI6n2L15l8Mo5ZCjjPwBocEEhFxEEBn0xc3BOMpgicY3g9J0SdPXBktMPzmBWnChLIY9pNgYRGCJMSYRYcVd6SDUY5gIrICjyfsDfHqz26n0vBW9v5QsM814sOMrCmDxcfDswC+dsWfu/dSe6Moyk258O8xnZJUvX0XMQyNq/NGl03TUmmd3iWbIBlyT3Y+N1WzgVXllejqy1pOr7VVIXYCMkpQ7D4w6TiQp86tj6TFvSpX+Ww7CsmuXUTGoNPOqgiqzp9uX5fUZN7ex4ESzbdSkWpeqIXDrFcj12XJXUtY/Q4U/Qnr/4zSk6iGe+tamCqo1ynB48Gj1XwVuhL/aQu3mn0YOzu4gk9vqQa/VRdPtHAnqNY462uRiyMNSCHsKGedqvTBEiQ0XcwWCYk9zrlEP+TT/FhBiUUDbMEdi2YT0JCugp4tCKYj6mue6iQoyj5lcCKd9WtEBUpGCtCKnjiONrxOOVYzJG8Rnzexsc6XH+j/xioxDGrd/UkZ839esfDKF33+QT","w":40,"h":40,"aspect":"fixed","title":"FTG: Automated transformation"},{"xml":"dVPbkqIwEP0aqnbfgIzKPg43B0dxHFFXXrYCRAMEwoZw8+s3XNwZq2aKStGX053uPh0JGFm7ZLDAGxohIgFLAgajlI9S1hqIEEmV40gCpqSqsjiSan/jVQavXECGcv5FAA0SFHKBIDDoLzMH5yyHGRK/KTh7pwSNvgzmfziDeXmhLIM8pvmIGQIGxAbmFSTeF5iCwBBhSiLEyofq7sWqvfrYR8m7+9UlhkUvlhzlYUx+JL4dmKVztazj7+YmOjKM9Ha8nJ4X5JCuXEcvQCBrf7O01XXXmOV2hxfpDiRp4cfGZl86NV5bXoGsraTqx3XalGAnJKUJw/MBk5kKfOrY+kJb0ZV/lcOwqtvV3EwbDTzpoI6s+f715X1BTe3qeBGsum0lSFJ1RJKbYrkeO68r6tpn6PBf0H5+9dtLdBJlvnWZguqdcp6fPBq91MFbqS+PkLvFTaMn55CIJPb2VGjNWXT7UwJ6g2OO9oWYnjA0YjWEDfOsp0sRIkNlfIPBMCe51ymH/JN+iQkxKKFsmCOw5v0n7Bni0IpiPqUZuagR46j9dnmUTxQtERUpWCcgTRxxPCKexv2SMYqvmD/a4MT79X/kxyYKYWL9rk67eVc/3sAAfXgi/wA=","w":40,"h":40,"aspect":"fixed","title":"FTG: Manual transformation"},{"xml":"dVNtc6IwEP41zNx9A1KV+1giWKzVtr6dfrkJEA0SSC6JgP76W0GvdabNTCb78myyu8/GQrhoRopI9iJSyi0UWAgrIUwnFQ2mnFuunaUWGlqua8O23PAbr9N6bUkULc0XASI+0MQAgpP48tiwdfZKUlA4rsHFu+C08yWikH+MIqXeCVUQk4myA7URLQQDROjM0MUXMMlJQpngKVX6LsNbwu5Fva9Fm9Ptec2IvIja0DLJ+I/DNoyHOtoHwep3fYaqMM7Pq936ccCX+Xga+RLFtve3yBvfn+JeGZ7YIH9Dh1xuM/wy11HFJsFC0mBmuf5qktcavYHk1EmyWTLec9FWRKE/8MZivN3bSXKsmnF/mNceevBRlQb9+fPT+0AMvX20SMnxNDsCUa5P+eHsBNOF2kyOYhpuSGR+kfDxedvs0jWk+XoqHFq9OZv+eiHSpyp+1f5oRcxUnj2xjpYHuCScraVXb6DanxbyawYdnUvoHhhqGA+wMVNcKHNAVFRnZxK3fbIvujDEfNILakiQZuYK32WcY8GFatuKQlgYg73joqLK0ObbAXI+UTSiAq5WJ4DUWWpYh3joZsxmNNszc28jV973/yM/phGEK+s39TqfN/XjH7TQu2/yDw==","w":40,"h":40,"aspect":"fixed","title":"FTG: Composite transformation"},{"xml":"dVJNb8IwDP01ufdjIHZt+ThxGZN2Do1pMpK4SsIK+/Vz0xSoNJAq7Pee4xfHrKzNded4J/coQLNyw8raIYYxMtcatGZFpgQr16woMvpYsX3B5pHNOu7Ahn8K8PgNTSCF5seh2TqSC8sN0F8qNh+oYeRO6AzXypuRirpIbOdEp3kDErUA52dOJmPFkM49+3Cb2ji8WAGDNGNl1UsV4NDRiQT0NBrCZDCD3ZxCL7nAPmlbzb1PsQ8Oz/ClRJBJelJa16jRxTalWMBKvA042vCEZ/FHON2otYQ1ND1wSXhIPgdBHFvFm3MbLU9nWLSkqBo0qklKfgno1e9U6Ok6yraf2M2BCkNAM8coW1LmgOr5MfbO79d7sr1cvy8Xg9JA4BuhQhKOk/8BF+D6ci3ypwfZAdIR7kaSPk2P2NW4OZkE1cpUVSaMp1du75WPHaMgvfGUpq2b0sd2R+ls+f8A","w":80,"h":30,"aspect":"fixed","title":"FTG: Formalism"},{"xml":"dVJdk5owFP01zLRvfFitjxBQtyxV2WrVtyCBBALBJID66zfA0tWZ7gPDPfeckzv3Q7NAcV1yWOGAxYhqlqdZgDMmh6i4AkSpZuok1ixXM01dfZq5+II1elavIEel/I+BRRk6S6WgMOqKuT3ZW4qQUTRkSEkkgXQgxqd73XNVIW+jRWBYdaGQqDwT+i0+LUJXvKSeF27au6oPwO6+RzdbCJI7dpX9NfUaJzmutll0Qn/A6bAlCnoO8NfLn47EM+9XdYH7pKbT3HZfrB0K/IvIq7B7zU0Jb5w6DcKgjX4cYsA10zms4ybNm8NmYUfG6+ptJc7babIV02b6e75e7ZUkDmo9cwN7k852Rz2LDDN/bQJrpqi6nKhGFseTn/rLWViIVQ2OKu/48qJ+k+CS2Kp797tmOS0mEr1V8Ny13KrlqRyWRTdQQ4UJoRQwyng/G0vXJ2A+V3khOcvRyJSsVHaHI0HuMOoHqSuMYiIfIGcSPuJhKQ3iEl2/3LnxsKslYgWS/KYkLYklHhTWcBY6RiTF8jkHxYDTf87PA1LBx/pH+HFSI/w83V76dNnv","w":30,"h":30,"aspect":"fixed","title":"PM: Initial"},{"xml":"dVNrr6IwEP01JHe/8bgS+CjPgMAqZlH5VrA8vIViWwTvr98KuleTNSnJnDlzOmTmVFDMZnQJ6KoQHyESFFtQTIIxm6NmNCFCgizWR0GxBFkW+SfIzhtWmlixAwS27D8CnJ1gzngFAtmtmTWRk6SJMYJzpqhbgOb04+Kp6rUnZdeHgFagu4WUwTav0UeRBIFFvdJeX8Flu7ahlSb8H9T1luzGFV46oaprgbHR9YPte2kJXCVBy8hRJW/wW5Nuot+WNjoX6HWD1HPlobymwap1MxYKssGPRUsjknBcb/7AEvvOPi8T5dRkse2p4igeXKrF1OGFq7BfI7q4+KPeyAt+1VklktS7huZHMRg7XW1xv08X39FCkwID5dsyPlu70Ki4+FMHqXTiwT7CyeBnSbJMhzb1oqI4ayKjvbLZRS3n7aoozV+CYgxVzeC2A/ltHANfK89VrLmNWuJhUSNkYoTJNDdFFD9NXed5ygj+gu+ZXX1kFWf4DgwCaf0Nsmn2IsfwWLMnSDADz3je4wUSBse3JpGe1utC3EBGrrxkuLflrDL7SKxgXVbsNQfojMt/yh/H8eDumAe8e/ABf7w+lb48hb8=","w":30,"h":30,"aspect":"fixed","title":"PM: Final"},{"xml":"dVI9c8IwDP01XntO0gyMJbRMXcrQsWdiQQyOlXPUAv31lRynlLsy+E567+nbqmr68zqaoXtFC15Vz6pqIiJNVn9uwHtVamdVtVJlqfmp8uUOWyRWDyZCoH8CcHuAlljhzVaKrRKZQvo39DAhO4zHjwO6MFFz8qS8rTvSZQ6K+BksiFSrannqHMFmMK2wJx6PsY56KVmwucNAG/ctZCHykSIe4d1Z6hgqReG8b9BjTNkrrR+bxYJx490+MNbygMDk8gsiudb4p0z0zlrpKeeccwQMAg48FY2Ss16qesUIWEdmm6aQTqaRJSmc7+60+LOJNWAPFC8sOeX+RaH1Qz0FduD2XQ7M19BmnPz9b/D1Rmzk/c5uvtrsXn9Hkt58nh8=","w":100.5,"h":20,"aspect":"fixed","title":"PM: Fork/join"},{"xml":"dVNNj5wwDP01uVYMiFH3uLAze2lVaXelHqtAPJBuiKkJ89FfXyckw8yqi0DB7z3HdhyLoh7OzyTH/jsqMKLYiaImRLf8DecajBF5ppUonkSeZ/yJfP8JuwlsNkoC6/7jgM1vaB0rjGx8sKdAbg1rqwNaz7RokAKz/TP7NCqRF1l4bqFtF9fgO69AaeUAvCSqoStXPAqfTuku462Cs5s/bsjYkk+CQ1nDCxpYspazw+GXbJ0+andZ+BB5ZaUD9UERIgfFY1K8kbTTAYkNjTYGMrKFHo0Cmu4ONp1z7s37FkzuknIjnK0CL91w7qdeO3gdeUcGTtxpxno3mEhPjvAdfmrl+oj4wutrF4pDeBhvGZfaAkUdd8rIcdJNiJsxogjHN0kduCiR1L7qv57+ytaI2rpQUFnxy62osy+lKDlKzfZmtfktKovf4i3xex+0MTdZ7ff17oFvVUXQzjTpI7zAtITyajiP0qpoNLJ978Kh/Jid4QoizgVZvo5yKcDnO4CTO6VT+suhH4EcnD+94JubXjwD8hbE3c5O8UR9tx7Kxa0H3fXJLU5GJmOLu6vvOi/8ExuczDhByVwnNUjvBvkf","w":295,"h":120,"aspect":"fixed","title":"PM: Automated activity"},{"xml":"dVPfb5wwDP5rIm0vFQfitD0O7tqXVZPaSnucDPgga0iYMfdjf/2cEMpdtULuiP3Zju0vVlnZnx8Ihu7RNWhUtldZSc7xvOvPJRqj0kQ3KtupNE3kp9L7D9BNQJMBCC3/x8FVv7FmsTBQ+cN2AdwasS0mUY98MRjU2z+Tz6GonXGksm8CUlt9kmiySvm/2n1ezWXXzt/cQo/yWcJX9IaFaALxZbi2kCyn1T/U0T+5mE/ag/0FNeuj5suMhgMWbALzDg7RA/wY4BcCOx4c9cDa2XiAgRo7Zxqk8aaDS0NTL972eu1RSm6yDXrTjeR86jTj8yARRXESSkXXcW8iPDK5V/ypG+6i5uAsl3N/JVp2CE/ouWXQFinaCQcGhlFX4dxENA254QWoRY4mQPWz/uvhLyINTlsOBeWFLM9TcperfOcJy4vNKsvKCuu+x+vgYxPWE436iE84ziG9Fs8D2CYKB23MVeL7rX89x1C/tqEpPyY2UkG0l4Ks3DuYC/D59siwb/SS/tz0IxLj+cObvLni4gGdhCChOjnFjnq2vuazW4e67Ra3OAIJRIrbN991MGQTCV7EOCqLuI5kML2Z2H8=","w":295,"h":120,"aspect":"fixed","title":"PM: Manual activity"},{"xml":"dVPbbtswDP0avdvW0j437mUvQ4GkwB4HRmZstbJkSMxtXz/q4tTZVgOJzcPDQ4qkhGzH84uHafjhOjRCPgnZeucof43nFo0RTaU7IR9F01T8E83zF946easJPFr6T4DbvaMiZhjYxWSPybmyMCK/GBfyIf43K7pMGUp648YZzHTlxukXKNJHTZfsTuFXpwua8C9GUkuMdma8ebBh7/wIpJ0teQwoHJzp0IebA83na6J5e/RAl7k07w62w0ithVyfBs6ynViRgRN3mLGBRlPcgbz7wJ+6o6Ege21M64zzSU0+89O2jCtnCbRFX3hH9KQVmAeje8sYuSi9Z9a21PKt2Au1Kj2MQ4lSPKEoufaoDj7oI24w6N8xPNLwPIHtisEVWJ4b7JJ6nRBjYAo6I5EzIsFTp6kQwKttVrtnawfqo0/teT2Q4bOUIJ9SLpuQkEWizPiOuh+oBOWRxC7g+cu1qxeTekHH1XnehepUUrFXyrscNsziccD3eV8rKAvQX2OvcpvYCttziU1VCribwy7Zns1FunpV/ZtOrm6zgeGZWCBcx16F5dXhj8VJPqG0hrNZ7tdsft7jHL285n8A","w":336,"h":270,"aspect":"fixed","title":"PM: Composite activity"},{"xml":"dVLLcsMgDPwa7n7UmfbYOG1OvTSd6ZkYxdBg5MFKnfTrKzDOYyY5GEurlbQIibLujmsve/2BCqwo30RZe0SarO5Yg7WiyIwS5UoURcafKN4fRPMYzXrpwdGdBNz+QEPMsHIbmq1isHKyA/4xLsrXcBYVnfoJivW6T7Qw0aUns5OhSIxY2YBGq8APNxJiyTsJsW7Ev2KH4kp9Edzbiw10mht7PDgFgcoql6M2BJueuzMw8vwY09SFO+VsDloqHBO3tXIYkj2Qxz18G0U6UXfG2hot+timVBU8qyfGpTWtY6zhUYIPRHS0SXoCIc5wKZt9G6XNNRw6Ziwb7EyTmsoD4WD+YNbAso1r2Vuw54FDchvL5meFV4oWq5dFFZgdkHxThhJxGt4veILjw+fPr2a6BuQS/sSUMQ0gMLJpRTINptUprUyYTK/anlMvy8RGeqfZTes1u5c1jtSbLf8H","w":100,"h":30,"aspect":"fixed","title":"PM: Artifact"},{"xml":"nVTbbtswDP0aP3bwZTa6x9ju+tIBRRtgj4NiMbY2WfRkNU729aNk+dalWzHABsjDQ5EiKQZJ0Z7vNeuaL8hBBsldkBQa0YxSey5AyiAOBQ+SMojjkP4g/vyGNXLWsGMalLnigIfvUBliSHawwUpnzCRxcy5OJNZWnKDDa+CIynr35iLBeWc/X3Ay3PTiF6E7Itx258U2HSLUdAzlM560PZ3gPyISdiWx90F9x9SCpR1qo1gLJK5O35L+FvQa8180Vw0KaC7df8d9J9k1XrIKGpQcdL+ZCBffAXuXiSO3T+jbGHNm2DfbIGeYCuVMS9ni1aTFVt0O4TIVscYXxcFSQ8ptaISB545SI2CgWSesMa2dv4hEDTQ47OB8rc41dnumazAeqGhWmFCgZ11K1vVidLER8AT6KHEg9SS8IVf44KfcUuw1ClS90XSUeULDjEA1GUGLFoyLoOmFMFVLeFzAvFes2+MjCvesrAtZ2B0XS46tqOZQRHP1T3P6qP9F+CENUqpMYXWSCXmlR7MeLXz6kpxJutlOaxx6H0BvswdKY1U/qoURFZM7KWpLaQXnriDMAxUth/FW1BOh6gc4TrfyCGnxou2ROlbeZP6dP7tnXkaWfxRSFihRu74nPIVb/tF6Go0/4KvgpvFZjciKm5WfsjSbR9dmDec311i0mrd7QKq+vhBl8BHImo6bLmxA1I3ZYsy/hnr2XHYiCX6EJ9VvyUldtrGjbpb1bw==","w":50,"h":50,"aspect":"fixed","title":"PM: Artifact input port"},{"xml":"nVTfb5wwDP5reOzEj4G6xwO6vnRS1Z60xylHfJAuxCzkjrv99XNCgKO7blUlkOzPn2PHdhwkRXu616xrviEHGSR3QVJoRDNK7akAKYM4FDxIyiCOQ/qD+Osb1shZw45pUOaKA+5eoDLEkGxng5XOmEni5lwcSaytOEG718AelfXuzVmC885+HXAy3PTiN6EbItx2p8U2HYIHM51DCY1HrY8n+K+QhF3J7H1Q3zG1YGmH2ijWAokXp69J/wp6jfk/misHBTTn7sNx30l2nZesggYlB92vRsLFd8DWZeLI7RP6PsacGfbDdchZpko521K3+GLWYquux3CZi1jjQXGw1JCSGxph4Lmj3AgYaNoJa0xrJzAiUQONDts5X6tzjd2W6RqMByoaFiYU6FmXknW9GF1sBDyC3kscSD0Kb8gVPvg5txR7jQJVbzQdZZ7QMCNQTUbQogXjImh6I0zVEh4XMO8V67b4iMI9LOtCFnbHxZJjK6o5FNFcA9KcPhqAIvyUBilVprA6yYS80qNZjxY+fUnOJN1sozUOvQ+g19kDpXFRP6qFERWTGylqS2kF564gzAMVrYfxVtQToeoH2E+38ghp8aJtkTpW3mT+pT+7h15Glr8XUhYoUbu+JzyFW/7ZehqNP+G74KbxWY3IBTcrv2RpNs+uzRpOby6y6GLe7gGp+vpMlMFHIGs67rqwAVE3Zo0x/xzq2XPZiiT4EZ5UvycnddnHjrpa138A","w":50,"h":50,"aspect":"fixed","title":"PM: Artifact output port"},{"xml":"jVTBbtswDP0aHzvYchysx9hJe+mAog2w46DYrK1VFj1ajdN9/ShFtpM0xQokAPkeKT5StKK0aA/3JLvmB1ago3QTpQUh2qPVHgrQOhKxqqJ0HQkR8z8Sd5+wiWfjThIYeyUBd7+htByh5c4VW3tyqTk2r9SezdqZI7S7BF7QuOzevmvw2cs/bzgSN736y+iKA753h5kbD1FmPIb1HE86P53hDxUZuyLsa9BX1SbxNbmRyDoka2QLbP5f+hUBl6i/Gy1LaFBXQP35pbVPGHSK0pL+5ebliVGFp2ZN4uTihXPPd2JuWxC+mQpcaMw6hkZZeO5YBgMDrx5jjW3dOiRsEvBk5M7nOr8i7LaSarABKLl/qQzQ5Gstu14dU1wF3AO9aBzY3atA5AYfwtK5ENdGgaa3xEfZJ7TSKjQjCaRasL4C8cJKU2t4nMG8N7Lb4iMqv+UuhRm5qdSssVXlVIrD/KyznH/8QRTxtyzKeDKF89lm5MJPJj+Z4/mX5lJzZysiHPpQgM7VA8s4mR/PwqpS6pVWtQtpVVX5gcgAlPyt+q7cYj37rVwnwvlK6wI1kr/FdL3YJHeZ694SvsIJE8eL4vbWMXyrytRb5Dtd3yyn2J+qsg1DYlpDpwoOn74ayck+3QPydOmdQ4ZwDrPZ8WGJG1B1E7IWAZNhs+spc36C2AgrOrrhURrd+fHzoWdv4z8=","w":50,"h":40,"aspect":"fixed","title":"PM: Control flow input port"},{"xml":"jVRNb9swDP01Pnaw5ThYj7Gd9rIBRRtgx0GxWVubLHq08tH9+lGKbCdpihVIAPI9UnwiaUVp0R0fSfbtd6xBR+k6SgtCtCerOxagdSRiVUdpGQkR8z8SDx+wiWfjXhIYeyMBt7+gshyh5dYVKz251Byb12rPZuPMEdpeA69oXPZg3zT47OWfHY7E3aD+MrrigK/9cebGQ3Bnx3NY0Omoy+MZfleSsRvKPgd9Vm4S39IbiaxHskZ2wOb/pd8QcI364WhZQYu6Bhoup9Y9Y9ApKkv6p2+YZ0YZnptFibPRC+debsV8b0G4MzW40JiFHFpl4aVnHQwcePkYa23nFiJhk4BbI7c+1/k1Yb+R1IANQMUNkMoATb7Wsh/UKcVVwD3Qq8YDu3sViNzgt7B2LsRdo0AzWOKj7DNaaRWakQRSHVhfgXhlpWk0PM1gPhjZb/AJld9zl8KMXNdq1tipairFYb7ZWc4//iSK+EsWZdyZwvlsM3LlJ5OfzPH8S3Op+WYrIjwMoQBdqgeWcdY/7oVVldQrrRoX0qm69g2RAaj4a/W3cpv14teyTITzldYFaiQ/xbRcrJOHzN3eEv6GMyaOF8X9vWN4qso0G+SZlnfLKfaHqm3LkJj20KmC44fvRnK2T4+A3F1645BDOIfZ7PS0xC2opg1Zi4DJsNrNlDk/QmyEFR3d8CyN7vz8+dCL1/Ef","w":50,"h":40,"aspect":"fixed","title":"PM: Control flow output port"},{"xml":"dVLNToQwEH6aXk1L0Q1Hl9U9mRj34NF0YRaqhdm0VcGnd6CUhegeSGbm+xvaMpk33d6qc/2EJRgmH5jMLaIPVdPlYAxLuC6Z3LEk4fSx5PEKKkaUn5WF1v8jwOM7FJ4YRh2HsN0IjpLmBQ2ESYGtt2jeTga/Axr9R/I62vk+6qCs4DC1nMkttOW9teQhd4VRzumChrVvhmBBpaOUD3jVpa9pQsbbEyUf9M9gIPjMyNGgHSMk52meZYSEvYbEq38uFsvuARvwtieKBaO8/lrrlAttNfNm6TPqdjiyPjBSvlY4/LQFTKTl1URdF3U3nMvbJEuF2Nylm7WLV7YC/8eFisXul9F49rGdLjW2l8cT1Mu39Qs=","w":40.003529411764895,"h":40,"aspect":"fixed","title":"PM: Control flow"},{"xml":"dVJLb4MwDP41uQOhaDtusPU0aVoPO04pcSFdwFXibbBfv5AESrU2UiT7e9h5mPGyG7ZGnNoXlKAZf2K8NIgUom4oQWuWJUoyXrEsS9xm2fMNNvVschIGerpiwP0RanIKLfZTs8qT3tK9oYaASEHi46DxJ1Bzca+87GtpnE0gG9jFNGH8EXr5YIyrwataC2tV7cCWuqlr6kJLBj/hXUlqI3LAnnbqdyqQ5jEvUaPxDXji14QrrVe43MCdzJeKK6ao7otN4RgpbAsytgmXmo57883S1U23gB2QGZ3EgBakvi99woa0WXSL9RVVPz32GBR5cumw+GVqiKL1p86+4bqPhGmA/vlcsDrtGfJfNadxAOb0PGjBvZ7DPw==","w":40,"h":40,"aspect":"fixed","title":"Data flow"},{"xml":"dVJNb4MwDP01uQeodt/o2tOkqp204xSIV7KGGAVvg/365YsCWhspkt+zn+3YYUXZDnsruuYFJWhWPLOitIgUrXYoQWuWcyVZsWV5zt1l+e6ONwte3gkLhm4IsPqEmlyEFpUvtg3OIGmPqCEyNHYg36sxeqbcIXBdtqdx0oA8wylBzoonMPLRWvxxsNJYX14bZRzdUOvLZs7syeIF3pSkJjEfaOikfn2KbJNwiRptKFHwcBwvRd+ATCIPDoIIrAlMzufkC/FDOLGxndJTEw6lit4XH+yfcnec2WIKe8AWyLo5cQtakPpe60Qf4fkad5UeUBm/hzFGbPha0eOXrSEFLfc96YbbOhL2DPRP54xFtzMV1jjB9DcmOP/BqF5+0T8=","w":40,"h":40,"aspect":"fixed","title":"Typed-by"}]</mxlibrary>';

  const portsExamplesLib = '<mxlibrary>[{"xml":"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","w":899.9999999999997,"h":665,"aspect":"fixed","title":"Example: Fictional FTG+PM"}]</mxlibrary>';

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
