import { Component } from '@angular/core';

import { DepartmentLinkResult } from '../../models/departmentLinkResult';
import { CallResult } from '../../models/callResult';
import { CallsWidgetSettings } from '../../models/callsWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings';

@Component({
  selector: 'calls-widget',
  templateUrl: 'calls-widget.html'
})
export class CallsWidget {
  public calls: CallResult[];
  public links: DepartmentLinkResult[];
  public settings: CallsWidgetSettings;
  private settingsUpdatedSubscription: any;

  constructor(private dataProvider: DataProvider,
    private widgetPubSub: WidgetPubSub,
    private settingsProvider: SettingsProvider) {
    this.settings = new CallsWidgetSettings();
  }

  ngOnInit() {
    this.dataProvider.getLinkedDepartments().subscribe(
      data => {
        this.links = data;
      });

    this.settingsProvider.loadCallWidgetSettings().then((settings) => {
      if (settings) {
        this.settings = settings;
      }
      this.fetch();
    });

    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.CALLS_SETTINGS) {
        this.settings = e.data;
      } else if (e.event === this.widgetPubSub.EVENTS.CALL_STATUS_UPDATED) {
        this.fetch();
      }
    });
  }

  private fetch() {
    this.dataProvider.getCalls().subscribe(
      data => {
        this.calls = data;

        this.links.forEach(link => {
          this.dataProvider.getLinkCalls(link.LinkId, link.Color).subscribe(
            data => {
              this.calls = this.calls.concat(data);
            });
        });
      });
  }
}