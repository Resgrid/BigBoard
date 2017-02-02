import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { MapWidgetSettings } from '../../models/mapWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';

import { SettingsProvider } from '../../providers/settings';

@Component({
  selector: 'map-modal',
  templateUrl: 'map-modal.html' 
})
export class MapModal {
  public model: MapWidgetSettings;
  private removeWidget;
  private closeModal;
  public types: string[];
  
  constructor(private navParams: NavParams,
              private consts: Consts,
              private settingsProvider: SettingsProvider,
              private widgetPubSub: WidgetPubSub) {
    this.removeWidget = this.navParams.get('removeWidget')
    this.closeModal = this.navParams.get('closeModal')

    this.types = new Array<string>("Roadmap", "Satellite", "Hybrid", "Terrain")
    this.model = new MapWidgetSettings();
  }

  ngOnInit() {
    this.settingsProvider.loadMapWidgetSettings().then((settings) => {
      if (settings) {
        this.model = settings;
      }
    });
  }

  save() {
    this.settingsProvider.saveMapWidgetSettings(this.model).then(() => {
      this.widgetPubSub.emitMapWidgetSettingsUpdated(this.model);
      this.closeModal();
    });
  }

  remove() {
    this.removeWidget(this.consts.WIDGET_TYPES.MAP);
  }

  close() {
    this.closeModal();
  }
}