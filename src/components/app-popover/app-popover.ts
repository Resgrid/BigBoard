import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

@Component({
  selector: 'app-popover',
  templateUrl: 'app-popover.html' 
})
export class AppPopover {
  private saveLayoutCallback;
  private loadLayoutCallback;
  private clearLayoutCallback;

  constructor(private navParams: NavParams) {
    this.saveLayoutCallback = this.navParams.get('saveLayout')
    this.loadLayoutCallback = this.navParams.get('loadLayout')
    this.clearLayoutCallback = this.navParams.get('clearLayout')
  }

  saveLayout() {
    this.saveLayoutCallback();
  }

  loadLayout() {
    this.loadLayoutCallback();
  }

  clear() {
    this.clearLayoutCallback();
  }
}