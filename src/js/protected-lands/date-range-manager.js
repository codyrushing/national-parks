import noUiSlider from 'nouislider'
import throttle from 'lodash.throttle';

export default class DateRangeManager {
  constructor(params){
    this.params = params;
    this.build(true);
    window.addEventListener('resize', throttle(this.on_resize.bind(this), 300));
  }
  dateAccessor(d){
    return d.getFullYear();
  }
  build(startAnimation){
    const isLandscape = window.innerWidth / window.innerHeight > 1;
    if(this.slider){
      this.slider.destroy();
    }
    // this.params.container.style.height = isLandscape ? '300px' : null;
    const min = this.dateAccessor(this.params.extent[0]);
    const max = this.dateAccessor(this.params.extent[1]);
    this.slider = noUiSlider.create(
      this.params.container,
      {
        start: [min, min+1],
        orientation: 'horizontal',
        direction: 'ltr',
        connect: true,
        step: 1,
        range: {
          min,
          max
        }
      }
    );
  }
  on_resize(){
    // this.build();
  }

}
