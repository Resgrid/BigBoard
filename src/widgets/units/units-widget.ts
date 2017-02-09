import { Component } from '@angular/core';

import { UnitStatusResult } from '../../models/unitStatusResult';
import { UnitsWidgetSettings } from '../../models/unitsWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings'

@Component({
  selector: 'units-widget',
  templateUrl: 'units-widget.html'
})
export class UnitsWidget {
  public units: UnitStatusResult[];
  public settings: UnitsWidgetSettings;
  private settingsUpdatedSubscription: any;

  constructor(private dataProvider: DataProvider,
              private widgetPubSub: WidgetPubSub,
              private settingsProvider: SettingsProvider) {
    this.settings = new UnitsWidgetSettings();
  }

  ngOnInit() {
    this.settingsProvider.loadUnitsWidgetSettings().then((settings) => {
      if (settings) {
        this.settings = settings;
      }

      this.fetch();
    });

    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.CALLS_SETTINGS) {
        this.settings = e.data;
      } else if (e.event === this.widgetPubSub.EVENTS.UNIT_STATUS_UPDATED) {
         this.fetch();
      }
    })
  }

  private fetch() {
    this.dataProvider.getUnitStatuses().subscribe(
      data => {
        this.units = data;
      });
  }
}