import {Component, Input, Output, EventEmitter} from '@angular/core';

/*
  Dumb component to display:
   - top icon
   - title
   - bold paragrah
   - additional paragraph for more details (with optional icon)
   - button

  All the elements above are optional and come from inputs.
  (If you don't provide one of the inputs, the corresponding element will not be rendered)
*/
@Component({
  selector: 'cta-panel',
  templateUrl: 'cta-panel.html'
})
export class CTAPanel {
  @Input() topIcon: string;
  @Input() title: string;
  @Input() details: string;
  @Input() extraDetails: string;
  @Input() extraDetailsIcon: string;
  @Input() btnLabel: string;

  @Output() ctaClick = new EventEmitter();

  constructor() {}

  onCtaClick() {
    this.ctaClick.emit();
  }
}
