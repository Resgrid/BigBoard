import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';

@Component({
  selector: 'add-popover',
  templateUrl: 'add-popover.html' 
})
export class AddPopover {
  private addWidget;
  private addedWidgets: string;

  constructor(private navParams: NavParams, private consts: Consts) {
    this.addWidget = this.navParams.get('addWidget')
    this.addedWidgets = this.navParams.get('addedWidgets')
  }

  addCallsWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.CALLS);
  }

  addPersonnelWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.PERSONNEL);
  }

  addUnitsWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.UNITS);
  }

  addMapWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.MAP);
  }

  addWeatherWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.WEATHER);
  }

  addLinksWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.LINKS);
  }

  addNotesWidget() {
    this.addWidget(this.consts.WIDGET_TYPES.NOTES);
  }

  isWidgetActive(widgetId) {
    if (this.addedWidgets) {
      return this.addedWidgets.includes(widgetId);
    }

    return false;
  }
}