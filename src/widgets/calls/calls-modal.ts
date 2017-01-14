import { Component, ViewChild, ElementRef } from '@angular/core';
import { PopoverController, NavParams } from 'ionic-angular';

import { WidgetPubSub } from '../../providers/widget-pubsub';

@Component({
  selector: 'calls-modal',
  templateUrl: 'calls-modal.html' 
})
export class CallsModal {
  private removeWidget;
  private closeModal;

  constructor(private navParams: NavParams,
              private widgetPubSub: WidgetPubSub) {
    this.removeWidget = this.navParams.get('removeWidget')
    this.closeModal = this.navParams.get('closeModal')
  }

  save() {
   
  }

  remove() {
    this.removeWidget(5);
  }

  close() {
    this.closeModal();
  }
}