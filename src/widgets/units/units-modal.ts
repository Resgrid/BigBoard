import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { UnitsWidgetSettings } from '../../models/unitsWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';

import { SettingsProvider } from '../../providers/settings';

@Component({
  selector: 'units-modal',
  templateUrl: 'units-modal.html' 
})
export class UnitsModal {
  public model: UnitsWidgetSettings;
  private removeWidget;
  private closeModal;
  
  constructor(private navParams: NavParams,
              private consts: Consts,
              private settingsProvider: SettingsProvider,
              private widgetPubSub: WidgetPubSub) {
    this.removeWidget = this.navParams.get('removeWidget')
    this.closeModal = this.navParams.get('closeModal')

    this.model = new UnitsWidgetSettings();
  }

  ngOnInit() {
    this.settingsProvider.loadUnitsWidgetSettings().then((settings) => {
      if (settings) {
        this.model = settings;
      }
    });
  }

  save() {
    this.settingsProvider.saveUnitsWidgetSettings(this.model).then(() => {
      this.widgetPubSub.emitUnitsWidgetSettingsUpdated(this.model);
      this.closeModal();
    });
  }

  remove() {
    this.removeWidget(this.consts.WIDGET_TYPES.UNITS);
  }

  close() {
    this.closeModal();
  }
}