import throttle from 'lodash.throttle';

export default class Chart {
  constructor(container=document.body, params, data){
    this.container = container;
    this.params = this.defaultParams;
    this.updateParams(params);
    this.init();
    if(data){
      this.update(data);
    }
    return this;
  }
  updateParams(params){
    this.params = merge(this.params, params);
  }
  get defaultParams(){
    return {
      id: Math.round(Math.random() * 100000),
      autoSize: true,
      resizable: true,
      width: 640,
      height: 360,
      autoDomainX: true,
      autoDomainY: true,
      extraClasses: [],
      margins: {
        left: 10,
        top: 20,
        right: 10,
        bottom: 20
      }
    }
  }

  get clipPathId(){
    const { id } = this.params;
    return `clip-path-${id}`;
  }

  get dimensions(){
    var { margins, width, height } = this.params;
    if(this.container && this.params.autoSize){
      width = this.container.offsetWidth;
      height = this.container.offsetHeight;
    }
    return {
      width: width - margins.left - margins.right,
      height: height - margins.top - margins.bottom
    };
  }
  append(data){
    this.update((this.data || []).concat(data));
  }
  update(data){
    this.data = data;
    this.draw();
  }
  init(){
    this.initScales();
    this.initDOM();
    this.bindWindowEvents();
  }

  bindWindowEvents(){
    this.handleWindowResize = throttle(
      e => this.draw(),
      500
    );

    if(this.params.resizable){
      window.addEventListener(
        'resize',
        this.handleWindowResize
      );
    }
  }

  initDOM(){

  }

  initScales(){

  }

  destroy(){
    if(this.svg){
      this.svg.remove();
    }
    if(this.params.resizable){
      window.removeEventListener('resize', this.handleWindowResize);
    }
  }
  draw(){
    // build chart
  }
};
