
function filterStories(node, output){

  if(node.type === 'User Story'){
    output.push(node);
  }

  for( const child of node.children){
    filterStories(child, output);
  }
}

const COLOR_HASH = {
  New: { fill: "#f5f5f5", stroke: "#666666" },
  Active: { fill: "#dae8fc", stroke: "#6c8ebf" },
  Closed: { fill: "#d5e8d4", stroke: "#82b366" },
  Blocked: { fill: "#f8cecc", stroke: "#b85450" },
}

function hydrateTemplate(element, data) {

  const stories = [];
  filterStories(data, stories);

  for (const s of stories) {
    const tags = s.tags.filter(t => t.startsWith('mldlc-'));
    for (const t of tags) {
      const clr = COLOR_HASH[s.state];
      const elId = `#${t.replace('mldlc', 'r')}`;
      const el = element.querySelector(elId);
      el.setAttribute('fill', clr.fill);
      el.setAttribute('stroke', clr.stroke);
    }
  }
}

export function buildMldlcSvg(data) {

  console.log(data);

  const div = document.createElement('div');
  div.innerHTML = svgTemplate;

  hydrateTemplate(div, data);

  return div;
}


const svgTemplate = `
  <svg
      viewBox="0 0 1370 710"
      style="left: 0px; top: 0px; width: 100%; height: auto; display: block; position: relative; background-image: none; background-color: rgb(255, 255, 255);">
      <defs>
          <filter id="lightboxDropShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.7" result="blur"></feGaussianBlur>
              <feOffset in="blur" dx="3" dy="3" result="offsetBlur"></feOffset>
              <feFlood flood-color="#3D4574" flood-opacity="0.4" result="offsetColor"></feFlood>
              <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"></feComposite>
              <feBlend in="SourceGraphic" in2="offsetBlur"></feBlend>
          </filter>
      </defs>
      <g transformOrigin="0 0" transform="scale(0.83,0.83)translate(1166,330)">
          <g></g>
          <g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect x="-1100" y="-330" width="1570" height="710" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                      pointer-events="all"></rect>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect x="-860" y="245" width="315" height="110" rx="16.5" ry="16.5" fill="rgb(255, 255, 255)"
                      stroke="rgb(0, 0, 0)" pointer-events="all"></rect>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect x="-340" y="240" width="305" height="110" rx="16.5" ry="16.5" fill="rgb(255, 255, 255)"
                      stroke="rgb(0, 0, 0)" pointer-events="all"></rect>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect x="-30" y="-60" width="340" height="390" rx="51" ry="51" fill="rgb(255, 255, 255)"
                      stroke="rgb(0, 0, 0)" pointer-events="all"></rect>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -410 -15 L -356.37 -15" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -410 -15 L -356.37 -15" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -351.12 -15 L -358.12 -11.5 L -356.37 -15 L -358.12 -18.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect x="-750" y="-110" width="340" height="190" rx="28.5" ry="28.5" fill="rgb(255, 255, 255)"
                      stroke="rgb(0, 0, 0)" pointer-events="all"></rect>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -600 -60 L -566.37 -60" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -600 -60 L -566.37 -60" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -561.12 -60 L -568.12 -56.5 L -566.37 -60 L -568.12 -63.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-problem-statement" x="-720" y="-90" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-60"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -719px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      <div>Problem statement</div>
                                  </div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -500 -30 L -500 -10 L -500 -15 L -500 -1.37" fill="none" stroke="white"
                      stroke-miterlimit="10" pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -500 -30 L -500 -10 L -500 -15 L -500 -1.37" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M -500 3.88 L -503.5 -3.12 L -500 -1.37 L -496.5 -3.12 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-data-aquisition" x="-560" y="-90" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-60"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -559px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Data acquisition</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -560 35 L -593.63 35" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -560 35 L -593.63 35" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -598.88 35 L -591.88 31.5 L -593.63 35 L -591.88 38.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-analysis"  x="-560" y="5" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 35px; margin-left: -559px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Analysis</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -660 5 L -660 -15 L -660 -10 L -660 -23.63" fill="none" stroke="white"
                      stroke-miterlimit="10" pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -660 5 L -660 -15 L -660 -10 L -660 -23.63" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M -660 -28.88 L -656.5 -21.88 L -660 -23.63 L -663.5 -21.88 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-feedback" x="-720" y="5" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 35px; margin-left: -719px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Feedback</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -60 -15 L -16.37 -15" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -60 -15 L -16.37 -15" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -11.12 -15 L -18.12 -11.5 L -16.37 -15 L -18.12 -18.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect x="-370" y="-310" width="335" height="350" rx="50.25" ry="50.25" fill="rgb(255, 255, 255)"
                      stroke="rgb(0, 0, 0)" pointer-events="all"></rect>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-decision-modeling-process" x="-180" y="-140" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-110"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -179px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Decision Modeling process</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -290 -45 L -290 -110 L -186.37 -110" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -290 -45 L -290 -110 L -186.37 -110" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M -181.12 -110 L -188.12 -106.5 L -186.37 -110 L -188.12 -113.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -60 -190 L 360 -190 L 360 300 L 286.37 300" fill="none" stroke="white"
                      stroke-miterlimit="10" pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -60 -190 L 360 -190 L 360 300 L 286.37 300" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M 281.12 300 L 288.12 296.5 L 286.37 300 L 288.12 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-player-buffer-request-process" x="-180" y="-220" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-190"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -179px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Player Buffer Request Process</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -290 -45 L -290 -190 L -186.37 -190" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -290 -45 L -290 -190 L -186.37 -190" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M -181.12 -190 L -188.12 -186.5 L -186.37 -190 L -188.12 -193.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -290 -45 L -290 -270 L -186.37 -270" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -290 -45 L -290 -270 L -186.37 -270" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M -181.12 -270 L -188.12 -266.5 L -186.37 -270 L -188.12 -273.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-data-analytics-metrics-and-measure" x="-180" y="-300" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-270"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -179px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Data analytics Metrics and measures</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -60 -110 L 360 -110 L 360 300 L 286.37 300" fill="none" stroke="white"
                      stroke-miterlimit="10" pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -60 -110 L 360 -110 L 360 300 L 286.37 300" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M 281.12 300 L 288.12 296.5 L 286.37 300 L 288.12 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-definition-sign-off" x="-350" y="-45" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-15"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -349px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Definition sign off</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -230 -15 L -186.37 -15" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -230 -15 L -186.37 -15" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -181.12 -15 L -188.12 -11.5 L -186.37 -15 L -188.12 -18.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-sample-design" x="-180" y="-47.5" width="120" height="65" rx="9.75" ry="9.75" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-15"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -179px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Sample design</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 110 -15 L 153.63 -15" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 110 -15 L 153.63 -15" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 158.88 -15 L 151.88 -11.5 L 153.63 -15 L 151.88 -18.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-data-preparation" x="-10" y="-45" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-15"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: -9px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Data preparation</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 220 15 L 220 53.63" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 220 15 L 220 53.63" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 220 58.88 L 216.5 51.88 L 220 53.63 L 223.5 51.88 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-feature-engineering" x="160" y="-45" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%" y="-15"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 0px; margin-left: 161px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Feature engineering</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 160 90 L 116.37 90" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 160 90 L 116.37 90" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 111.12 90 L 118.12 86.5 L 116.37 90 L 118.12 93.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-tune" x="160" y="60" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 90px; margin-left: 161px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Tune</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 50 120 L 50 153.63" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 50 120 L 50 153.63" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 50 158.88 L 46.5 151.88 L 50 153.63 L 53.5 151.88 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-validation" x="-10" y="60" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 90px; margin-left: -9px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Validation</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 110 190 L 153.63 190" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 110 190 L 153.63 190" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 158.88 190 L 151.88 193.5 L 153.63 190 L 151.88 186.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-feature-selection" x="-10" y="160" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 190px; margin-left: -9px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Feature selection</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 220 160 L 220 126.37" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 220 160 L 220 126.37" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 220 121.12 L 223.5 128.12 L 220 126.37 L 216.5 128.12 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-model-selection" x="160" y="160" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 190px; margin-left: 161px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Model selection</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M 220 220 L 220 263.63" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M 220 220 L 220 263.63" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M 220 268.88 L 216.5 261.88 L 220 263.63 L 223.5 261.88 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -160 300 L -203.63 300" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -160 300 L -203.63 300" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -208.88 300 L -201.88 296.5 L -203.63 300 L -201.88 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-pre-deployment-impact-analysis" x="-160" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: -159px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Pre-deployment impact analysis</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -330 300 L -373.63 300" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -330 300 L -373.63 300" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -378.88 300 L -371.88 296.5 L -373.63 300 L -371.88 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-model-approval-and-sign-off" x="-330" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: -329px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Model approval and sign off</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -500 300 L -543.63 300" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -500 300 L -543.63 300" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -548.88 300 L -541.88 296.5 L -543.63 300 L -541.88 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-model-deployment" x="-500" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: -499px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Model deployment</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-post-deployment-impact-analysis" x="-670" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: -669px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Post-deployment impact analysis</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -60 -270 L 360 -270 L 360 300 L -33.63 300" fill="none" stroke="white"
                      stroke-miterlimit="10" pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -60 -270 L 360 -270 L 360 300 L -33.63 300" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" pointer-events="stroke"></path>
                  <path d="M -38.88 300 L -31.88 296.5 L -33.63 300 L -31.88 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-model-check-in-_-debrief" x="160" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: 161px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Model check in / debrief</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -670 300 L -723.63 300" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -670 300 L -723.63 300" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -728.88 300 L -721.88 296.5 L -723.63 300 L -721.88 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -970 270 L -970 -15 L -756.37 -15" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -970 270 L -970 -15 L -756.37 -15" fill="none" stroke="rgb(0, 0, 0)"
                      stroke-miterlimit="10" stroke-dasharray="3 3" pointer-events="stroke"></path>
                  <path d="M -751.12 -15 L -758.12 -11.5 L -756.37 -15 L -758.12 -18.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-monitor-and-maintain" x="-1030" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: -1029px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Monitor and maintain</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <path d="M -850 300 L -903.63 300" fill="none" stroke="white" stroke-miterlimit="10"
                      pointer-events="stroke" visibility="hidden" stroke-width="9"></path>
                  <path d="M -850 300 L -903.63 300" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10"
                      pointer-events="stroke"></path>
                  <path d="M -908.88 300 L -901.88 296.5 L -903.63 300 L -901.88 303.5 Z" fill="rgb(0, 0, 0)"
                      stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"></path>
              </g>
              <g transform="translate(0.5,0.5)" style="visibility: visible;">
                  <rect id="r-full-traffic-allocation" x="-850" y="270" width="120" height="60" rx="9" ry="9" fill="white" stroke="gray"
                      pointer-events="all"></rect>
              </g>
              <g style="">
                  <g>
                      <foreignObject pointer-events="none" width="100%" height="100%"
                          style="overflow: visible; text-align: left;">
                          <div
                              style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 300px; margin-left: -849px;">
                              <div data-drawio-colors="color: rgb(0, 0, 0); "
                                  style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                  <div
                                      style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">
                                      Full traffic allocation</div>
                              </div>
                          </div>
                      </foreignObject>
                  </g>
              </g>
          </g>
      </g>
  </svg>
  `;