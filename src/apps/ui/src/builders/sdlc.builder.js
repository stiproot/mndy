
export function buildSdlcSvg(data) {

  const div = document.createElement('div');
  div.innerHTML = svgTemplate;

  hydrateTemplate(div, data);

  return div;
}

function filterStories(node, output){

  if(node.type === 'User Story'){
    output.push(node);
  }

  for( const child of node.children){
    filterStories(child, output);
  }
}

const COLOR_HASH = {
  Approved: { fill: "#f5f5f5", stroke: "#666666" },
  New: { fill: "#f5f5f5", stroke: "#666666" },
  // New: { fill: "#b6b8b7", stroke: "#666666" },
  Active: { fill: "#dae8fc", stroke: "#6c8ebf" },
  Closed: { fill: "#d5e8d4", stroke: "#82b366" },
  Blocked: { fill: "#f8cecc", stroke: "#b85450" },
}

function hydrateTemplate(element, data) {

  const stories = [];
  filterStories(data, stories);

  for (const s of stories) {
    const tags = s.tags.filter(t => t.startsWith('sdlc-'));
    for (const t of tags) {
      const clr = COLOR_HASH[s.state];
      const elId = `#${t.replace('sdlc', 'r')}`;
      const el = element.querySelector(elId);
      el.setAttribute('fill', clr.fill);
      el.setAttribute('stroke', clr.stroke);
    }
  }
}


const svgTemplate = `
    <svg
        viewBox="0 0 1370 710"
        style="left: 0px; top: 0px; width: 100%; height: 100%; display: block; position: relative; background-image: none; background-color: rgb(255, 255, 255);">
        <defs>
            <filter id="lightboxDropShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.7" result="blur"></feGaussianBlur>
                <feOffset in="blur" dx="3" dy="3" result="offsetBlur"></feOffset>
                <feFlood flood-color="#3D4574" flood-opacity="0.4" result="offsetColor"></feFlood>
                <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"></feComposite>
                <feBlend in="SourceGraphic" in2="offsetBlur"></feBlend>
            </filter>
        </defs>
        <g transformOrigin="0 0" transform="scale(0.87,0.87)translate(531,-15)">
            <g></g>
            <g>
                <g style="visibility: visible;">
                    <rect x="455" y="15" width="525" height="90" fill="#c1e4f7" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 521px; height: 1px; padding-top: 18px; margin-left: 457px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 519px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        The Project</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="125" y="15" width="330" height="90" fill="#ffeca9" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 326px; height: 1px; padding-top: 18px; margin-left: 127px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 324px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        The Solution</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-205" y="15" width="330" height="90" fill="#c7e8ac" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 326px; height: 1px; padding-top: 18px; margin-left: -203px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 324px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        The Customer</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-340" y="555" width="1320" height="150" fill="#b2b2b2" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="visibility: visible;">
                    <rect x="-340" y="406" width="1320" height="150" fill="#cccccc" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="visibility: visible;">
                    <rect x="-340" y="255" width="1320" height="150" fill="#b2b2b2" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="visibility: visible;">
                    <rect x="-340" y="105" width="1320" height="150" fill="#cccccc" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 867.5 90.76 L 867.5 412.5 Q 867.5 412.5 867.5 412.5 L 867.98 721.92" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 867.5 90.76 L 867.5 412.5 Q 867.5 412.5 867.5 412.5 L 867.98 721.92" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                    <path d="M 867.99 730.92 L 863.48 721.93 L 872.48 721.91 Z" fill="rgb(0, 0, 0)"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="868" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 537.5 90.76 L 537.5 412.5 Q 537.5 412.5 537.5 412.5 L 537.98 721.92" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 537.5 90.76 L 537.5 412.5 Q 537.5 412.5 537.5 412.5 L 537.98 721.92" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                    <path d="M 537.99 730.92 L 533.48 721.93 L 542.48 721.91 Z" fill="rgb(0, 0, 0)"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="538" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 705.5 195.51 L 705.5 465 Q 705.5 465 705.5 465 L 703 465 Q 703 465 703 465 L 703 721.92"
                        fill="none" stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 705.5 195.51 L 705.5 465 Q 705.5 465 705.5 465 L 703 465 Q 703 465 703 465 L 703 721.92"
                        fill="none" stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10"
                        pointer-events="stroke"></path>
                    <path d="M 703 730.92 L 698.5 721.92 L 707.5 721.92 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)"
                        stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="703" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 372.5 90.76 L 372.5 412.5 Q 372.5 412.5 372.5 412.5 L 372.98 721.92" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 372.5 90.76 L 372.5 412.5 Q 372.5 412.5 372.5 412.5 L 372.98 721.92" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                    <path d="M 372.99 730.92 L 368.48 721.93 L 377.48 721.91 Z" fill="rgb(0, 0, 0)"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="373" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 207.5 90.76 L 207.5 412.5 Q 207.5 412.5 207.5 412.5 L 207.98 721.92" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 207.5 90.76 L 207.5 412.5 Q 207.5 412.5 207.5 412.5 L 207.98 721.92" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                    <path d="M 207.99 730.92 L 203.48 721.93 L 212.48 721.91 Z" fill="rgb(0, 0, 0)"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="208" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="43" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 42.5 90.76 L 42.5 412.5 Q 42.5 412.5 42.5 412.5 L 42.98 721.92" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 42.5 90.76 L 42.5 412.5 Q 42.5 412.5 42.5 412.5 L 42.98 721.92" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                    <path d="M 42.99 730.92 L 38.48 721.93 L 47.48 721.91 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)"
                        stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="43" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-recognized" x="-25" y="120" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 135px; margin-left: -23px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Recognized</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-represented" x="-25" y="165" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 180px; margin-left: -23px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Represented</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-involved" x="-25" y="210" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 225px; margin-left: -23px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Involved</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-25" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: -23px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        In Agreement</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-25" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: -23px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Approve Deployment</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-24.5" y="570" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 585px; margin-left: -22px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Satisfied in Use</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="140" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 142px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Bounded</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="140" y="315" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 330px; margin-left: 142px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Coherent</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="140" y="360" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 375px; margin-left: 142px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Acceptable</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="140" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: 142px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Addressed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="140" y="465" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 480px; margin-left: 142px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Fulfilled</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="306" y="315" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 330px; margin-left: 308px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 14px; font-family: Roboto; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Designed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="305" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: 307px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Demonstrable</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="305" y="465" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 480px; margin-left: 307px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Useable</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="306" y="614" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 629px; margin-left: 308px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Operational</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="305" y="659" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 674px; margin-left: 307px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Legacy Retired</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-initiated" x="470" y="120" width="135" height="30" fill="#d5e8d4" stroke="#82b366" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 135px; margin-left: 472px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Initiated</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="470" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 472px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Prepared</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="471" y="465" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 480px; margin-left: 473px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Under Control</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-foundation" x="800" y="120" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 135px; margin-left: 802px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Foundation</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-in-use" x="800" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 802px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        In Use</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-25" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#c7e8ac"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: -23px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Stakeholders</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="800" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#c1e4f7"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: 802px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Process</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="140" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#ffeca9"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: 142px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Requirements</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="305" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#ffeca9"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: 307px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        System</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="635" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#c1e4f7"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: 637px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Team</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="470" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#c1e4f7"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: 472px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Work</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-340" y="105" width="94" height="30" fill-opacity="0" fill="#ffffff" stroke="rgb(0, 0, 0)"
                        stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe flex-start; width: 90px; height: 1px; padding-top: 108px; margin-left: -337px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: left; width: 88px;">
                                    <div
                                        style="display: inline-block; font-size: 16.7px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Inception</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-335" y="255" width="120" height="15" fill-opacity="0" fill="#ffffff" stroke="rgb(0, 0, 0)"
                        stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe flex-start; width: 116px; height: 1px; padding-top: 258px; margin-left: -332px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: left; width: 114px;">
                                    <div
                                        style="display: inline-block; font-size: 16.7px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Analysis and Design</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-335" y="405" width="141" height="30" fill-opacity="0" fill="#ffffff" stroke="rgb(0, 0, 0)"
                        stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe flex-start; width: 137px; height: 1px; padding-top: 408px; margin-left: -332px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: left; width: 135px;">
                                    <div
                                        style="display: inline-block; font-size: 16.7px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Implementation</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-335" y="556" width="109" height="30" fill-opacity="0" fill="#ffffff" stroke="rgb(0, 0, 0)"
                        stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe flex-start; width: 105px; height: 1px; padding-top: 559px; margin-left: -332px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: left; width: 103px;">
                                    <div
                                        style="display: inline-block; font-size: 16.7px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Deployment</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-formed" x="637" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: 639px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Formed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-collaborating" x="637" y="465" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 480px; margin-left: 639px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Collaborating</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="636" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 638px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Formed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="636" y="315" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 330px; margin-left: 638px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Collaborating</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="800" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: 802px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        In Use</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="470" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: 472px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Started</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="306" y="570" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 585px; margin-left: 308px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Ready</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="638" y="570" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 585px; margin-left: 640px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Formed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="637" y="615" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 630px; margin-left: 639px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Collaborating</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="801" y="570" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 585px; margin-left: 803px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        In Use</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="305" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 307px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13.3px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Architecture Selected</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="471" y="570" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 585px; margin-left: 473px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 14px; font-family: Roboto; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Concluded</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-performing" x="636" y="360" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 375px; margin-left: 638px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Performing</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="636" y="659" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 674px; margin-left: 638px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Performing</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="637" y="510" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 525px; margin-left: 639px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Performing</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-346" y="135" width="141" height="120" fill-opacity="0" fill="#ffffff"
                        stroke="rgb(0, 0, 0)" stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 137px; height: 1px; padding-top: 138px; margin-left: -344px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 135px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        <ul
                                            style="margin: 0px; padding-left: 10px;list-style-position: inside; list-style-type:disc">
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">SEM</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Project
                                                        Manager</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Business
                                                        Analyist</span></span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="800" y="165" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 180px; margin-left: 802px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        In Use</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-346" y="300" width="141" height="90" fill-opacity="0" fill="#ffffff" stroke="rgb(0, 0, 0)"
                        stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 137px; height: 1px; padding-top: 303px; margin-left: -344px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 135px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        <ul
                                            style="margin: 0px; padding-left: 10px;list-style-position: inside; list-style-type:disc">
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">SEM</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Project
                                                        Manager</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Business
                                                        Analyist</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Tech Lead</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Architect</span></span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-346" y="435" width="141" height="121" fill-opacity="0" fill="#ffffff"
                        stroke="rgb(0, 0, 0)" stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 137px; height: 1px; padding-top: 438px; margin-left: -344px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 135px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        <ul
                                            style="margin: 0px; padding-left: 10px;list-style-position: inside; list-style-type:disc">
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">SEM</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Project
                                                        Manager</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Business
                                                        Analyist</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Tech Lead</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Architect</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Developer</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">SDET</span></span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-346" y="585" width="141" height="121" fill-opacity="0" fill="#ffffff"
                        stroke="rgb(0, 0, 0)" stroke-opacity="0" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe flex-start; justify-content: unsafe center; width: 137px; height: 1px; padding-top: 588px; margin-left: -344px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 135px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        <ul
                                            style="margin: 0px; padding-left: 10px;list-style-position: inside; list-style-type:disc">
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">SEM</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Project
                                                        Manager</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Business
                                                        Analyist</span></span></li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Tech Lead</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Architect</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">Developer</span></span>
                                            </li>
                                            <li style="text-align:left;color:#000000;"><span
                                                    style="margin-left: 0px;margin-top: -2px;"><span
                                                        style="font-size:13px;color:#000000;">SDET</span></span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-190" y="45" width="135" height="45" rx="22.5" ry="22.5" fill="#c7e8ac"
                        stroke="rgb(0, 0, 0)" stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 68px; margin-left: -188px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 39px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Opportunity</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M -122.5 90 L -122.5 412.5 Q -122.5 412.5 -122.5 412.5 L -122.02 722.65" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M -122.5 90 L -122.5 412.5 Q -122.5 412.5 -122.5 412.5 L -122.02 722.65" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                    <path d="M -122.01 731.65 L -126.52 722.65 L -117.52 722.64 Z" fill="rgb(0, 0, 0)"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <ellipse cx="-122" cy="749.5" rx="15" ry="14.5" fill="#666666" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></ellipse>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-identified" x="-190" y="120" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 135px; margin-left: -188px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Identified</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect id="r-value-established" x="-190" y="165" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 180px; margin-left: -188px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Value Established</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-189.5" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: -187px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Viable</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="635" y="210" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 225px; margin-left: 637px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Performing</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-190" y="420" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 435px; margin-left: -188px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Addressed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-195" y="570" width="135" height="30" fill="#ffffff" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 585px; margin-left: -193px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Benefit Accrued</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="-406" y="405" width="60" height="299" fill="none" stroke="white" pointer-events="stroke"
                        visibility="hidden" stroke-width="9"></rect>
                    <rect x="-406" y="405" width="60" height="299" fill="none" stroke="none" pointer-events="all">
                    </rect>
                </g>
                <g style="visibility: visible;">
                    <path
                        d="M -346 405 L -355.34 405 Q -364.69 405 -364.69 415 L -364.69 544.5 Q -364.69 554.5 -374.03 554.5 L -378.7 554.5 Q -383.38 554.5 -374.03 554.5 L -369.36 554.5 Q -364.69 554.5 -364.69 564.5 L -364.69 694 Q -364.69 704 -355.34 704 L -346 704"
                        fill="none" stroke="white" stroke-width="9.5" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path
                        d="M -346 405 L -355.34 405 Q -364.69 405 -364.69 415 L -364.69 544.5 Q -364.69 554.5 -374.03 554.5 L -378.7 554.5 Q -383.38 554.5 -374.03 554.5 L -369.36 554.5 Q -364.69 554.5 -364.69 564.5 L -364.69 694 Q -364.69 704 -355.34 704 L -346 704"
                        fill="none" stroke="rgb(0, 0, 0)" stroke-width="1.5" stroke-miterlimit="10"
                        pointer-events="all"></path>
                </g>
                <g style="visibility: visible;">
                    <rect x="-406" y="405" width="22.63" height="299" fill="none" stroke="white" pointer-events="stroke"
                        visibility="hidden" stroke-width="9"></rect>
                    <rect x="-406" y="405" width="22.63" height="299" fill="none" stroke="none" pointer-events="all">
                    </rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 19px; height: 1px; padding-top: 555px; margin-left: -404px;">
                                <div data-drawio-colors="color: #000000; "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; font-weight: bold; white-space: normal; overflow-wrap: normal;">
                                        Sprint Cycle</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="471" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 473px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Prepared</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g style="visibility: visible;">
                    <rect x="471" y="270" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)"
                        stroke-width="1.5" pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 285px; margin-left: 473px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Prepared</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 702.5 90.76 L 705.5 90.8 Q 705.5 90.8 705.5 90.8 L 705.5 119.25" fill="none"
                        stroke="white" stroke-width="11" stroke-miterlimit="10" pointer-events="stroke"
                        visibility="hidden"></path>
                    <path d="M 702.5 90.76 L 705.5 90.8 Q 705.5 90.8 705.5 90.8 L 705.5 119.25" fill="none"
                        stroke="rgb(0, 0, 0)" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"></path>
                </g>
                <g style="visibility: visible;">
                    <rect x="638" y="120" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 135px; margin-left: 640px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Formed</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
                <g transform="translate(0.5,0.5)" style="visibility: visible;">
                    <path d="M 705.5 150.51 L 705.5 164.25" fill="none" stroke="white" stroke-width="11"
                        stroke-miterlimit="10" pointer-events="stroke" visibility="hidden"></path>
                    <path d="M 705.5 150.51 L 705.5 164.25" fill="none" stroke="rgb(0, 0, 0)" stroke-width="3"
                        stroke-miterlimit="10" pointer-events="stroke"></path>
                </g>
                <g style="visibility: visible;">
                    <rect x="638" y="165" width="135" height="30" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" stroke-width="1.5"
                        pointer-events="all"></rect>
                </g>
                <g style="">
                    <g>
                        <foreignObject pointer-events="none" width="100%" height="100%"
                            style="overflow: visible; text-align: left;">
                            <div
                                style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 131px; height: 1px; padding-top: 180px; margin-left: 640px;">
                                <div data-drawio-colors="color: rgb(0, 0, 0); "
                                    style="box-sizing: border-box; font-size: 0px; text-align: center; width: 129px; max-height: 24px;">
                                    <div
                                        style="display: inline-block; font-size: 13px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; width: 100%; white-space: normal; overflow-wrap: normal;">
                                        Collaborating</div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                </g>
            </g>
            <g></g>
            <g></g>
        </g>
    </svg>
`;