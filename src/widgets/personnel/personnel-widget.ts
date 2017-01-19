import { Component } from '@angular/core';

import { PersonnelStatusResult } from '../../models/personnelStatusResult';
import { PersonnelWidgetSettings } from '../../models/personnelWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

@Component({
  selector: 'personnel-widget',
  templateUrl: 'personnel-widget.html'
})
export class PersonnelWidget {
  public statuses: PersonnelStatusResult[];
  public settings: PersonnelWidgetSettings;
  private settingsUpdatedSubscription: any;

  constructor(private dataProvider: DataProvider,
              private widgetPubSub: WidgetPubSub) {
    this.settings = new PersonnelWidgetSettings();
    this.fetch();
  }

  ngOnInit() {
    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_SETTINGS) {
        this.settings = e.data;
      } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_STATUS_UPDATED) {
         this.fetch();
      } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_STAFFING_UPDATED) {
         this.fetch();
      }
    });
  }

  private fetch() {
    this.dataProvider.getPersonnelStatuses().subscribe(
      data => {
        this.statuses = data;
      });
  }
}