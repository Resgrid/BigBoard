import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { PersonnelWidgetSettings } from '../../models/personnelWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';

import { SettingsProvider } from '../../providers/settings';

@Component({
  selector: 'personnel-modal',
  templateUrl: 'personnel-modal.html' 
})
export class PersonnelModal {
  public model: PersonnelWidgetSettings;
  private removeWidget;
  private closeModal;
  
  constructor(private navParams: NavParams,
              private consts: Consts,
              private settingsProvider: SettingsProvider,
              private widgetPubSub: WidgetPubSub) {
    this.removeWidget = this.navParams.get('removeWidget')
    this.closeModal = this.navParams.get('closeModal')

    this.model = new PersonnelWidgetSettings();
  }

  ngOnInit() {
    this.settingsProvider.loadPersonnelWidgetSettings().then((settings) => {
      if (settings) {
        this.model = settings;
      }
    });
  }

  save() {
    this.settingsProvider.savePersonnelWidgetSettings(this.model).then(() => {
      this.widgetPubSub.emitPersonnelWidgetSettingsUpdated(this.model);
      this.closeModal();
    });
  }

  remove() {
    this.removeWidget(this.consts.WIDGET_TYPES.PERSONNEL);
  }

  close() {
    this.closeModal();
  }
}