import noUiSlider from 'nouislider'
import throttle from 'lodash.throttle';

export default class DateRangeManager {
  constructor(params){
    this.params = params;
    this.build(true);
    window.addEventListener('resize', throttle(this.on_resize.bind(this), 300));
  }
  build(startAnimation){
    const isLandscape = window.innerWidth / window.innerHeight > 1;
    if(this.slider){
      this.slider.destroy();
    }
    this.params.container.style.height = isLandscape ? '300px' : null;
    this.slider = noUiSlider.create(
      this.params.container,
      {
        start: [1895, 1950],
        orientation: isLandscape ? 'vertical' : 'horizontal',
        direction: isLandscape ? 'rtl' : 'ltr',
        connect: true,
        step: 1,
        tooltips: true,
        range: {
          min: 1895,
          max: 2013
        }
      }
    );
  }
  on_resize(){
    this.build();
  }

}
