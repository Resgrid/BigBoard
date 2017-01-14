import { Component, ViewChild, ElementRef } from '@angular/core';
import { PopoverController, NavParams } from 'ionic-angular';

@Component({
  selector: 'add-popover',
  templateUrl: 'add-popover.html' 
})
export class AddPopover {
  private addWidget;
  private addedWidgets: string;

  constructor(private navParams: NavParams) {
    this.addWidget = this.navParams.get('addWidget')
    this.addedWidgets = this.navParams.get('addedWidgets')
  }

  addCallsWidget() {
    this.addWidget(5);
  }

  addPersonnelWidget() {
    this.addWidget(1);
  }

  addUnitsWidget() {
    this.addWidget(4);
  }

  addMapWidget() {
    this.addWidget(2);
  }

  addWeatherWidget() {
    this.addWidget(3);
  }

  isWidgetActive(widgetId) {
    if (this.addedWidgets) {
      return this.addedWidgets.includes(widgetId);
    }

    return false;
  }
}