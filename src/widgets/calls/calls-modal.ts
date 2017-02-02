import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { CallsWidgetSettings } from '../../models/callsWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';

import { SettingsProvider } from '../../providers/settings';

@Component({
  selector: 'calls-modal',
  templateUrl: 'calls-modal.html' 
})
export class CallsModal {
  public model: CallsWidgetSettings;
  private removeWidget;
  private closeModal;
  
  constructor(private navParams: NavParams,
              private consts: Consts,
              private settingsProvider: SettingsProvider,
              private widgetPubSub: WidgetPubSub) {
    this.removeWidget = this.navParams.get('removeWidget')
    this.closeModal = this.navParams.get('closeModal')

    this.model = new CallsWidgetSettings();
  }

  ngOnInit() {
    this.settingsProvider.loadCallWidgetSettings().then((settings) => {
      if (settings) {
        this.model = settings;
      }
    });
  }

  save() {
    this.settingsProvider.saveCallWidgetSettings(this.model).then(() => {
      this.widgetPubSub.emitCallWidgetSettingsUpdated(this.model);
      this.closeModal();
    });
  }

  remove() {
    this.removeWidget(this.consts.WIDGET_TYPES.CALLS);
  }

  close() {
    this.closeModal();
  }
}