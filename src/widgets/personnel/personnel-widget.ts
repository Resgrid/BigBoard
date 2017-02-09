import { Component, ChangeDetectorRef } from '@angular/core';

import { PersonnelStatusResult } from '../../models/personnelStatusResult';
import { PersonnelWidgetSettings } from '../../models/personnelWidgetSettings';
import { GroupSorting } from '../../models/groupSorting';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';
import { SettingsProvider } from '../../providers/settings'

@Component({
  selector: 'personnel-widget',
  templateUrl: 'personnel-widget.html'
})
export class PersonnelWidget {
  public statuses: PersonnelStatusResult[];
  public settings: PersonnelWidgetSettings;
  public groupSorts: GroupSorting[] = new Array<GroupSorting>();
  public groupHides: number[] = new Array<number>();
  private settingsUpdatedSubscription: any;

  constructor(private ref: ChangeDetectorRef,
    private dataProvider: DataProvider,
    private settingsProvider: SettingsProvider,
    private widgetPubSub: WidgetPubSub) {
    this.settings = new PersonnelWidgetSettings();
  }

  ngOnInit() {
    this.settingsProvider.loadPersonnelWidgetSettings().then((settings) => {
      if (settings) {
        this.settings = settings;
      }

      this.fetch();
    });

    this.settingsProvider.loadGroupSorting().then((groupSorts) => {
      if (groupSorts) {
        this.groupSorts = groupSorts;
      }
    });

    this.settingsProvider.loadGroupHiding().then((groupHides) => {
      if (groupHides) {
        this.groupHides = groupHides;
      }
    });

    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_SETTINGS) {
        this.settings = e.data;
        this.ref.detectChanges();
      } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_STATUS_UPDATED) {
        this.fetch();
      } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_STAFFING_UPDATED) {
        this.fetch();
      } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_GROUP_SORT_UPDATED) {
        this.groupSorts = e.data;
        this.ref.detectChanges();
      } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_GROUP_HIDE_UPDATED) {
        this.groupHides = e.data;
        this.ref.detectChanges();
      }
    });
  }

  public isPersonOrGroupHidden(status: PersonnelStatusResult): boolean {
    let index = this.groupHides.indexOf(status.GroupId, 0);

    if (index > -1) {
      return true;
    }

    if (this.settings.HideNotResponding) {
      let notRespondingText: string;

      if (this.settings.NotRespondingText) {
        notRespondingText = this.settings.NotRespondingText;
      } else {
        notRespondingText = "Not Responding";
      }

      if (status.Status == notRespondingText) {
        return true;
      }
    }

    if (this.settings.HideUnavailable) {
      let unavailableText: string;

      if (this.settings.UnavailableText) {
        unavailableText = this.settings.UnavailableText;
      } else {
        unavailableText = "Unavailable";
      }

      if (status.State == unavailableText) {
        return true;
      }
    }

    return false;
  }

  private getSortWeightForGroup(groupId: number): number {
    for (let group of this.groupSorts) {
      if (group.GroupId == groupId) {
        return group.Weight;
      }
    }

    return 10;
  }

  private fetch() {
    this.dataProvider.getPersonnelStatuses().subscribe(
      data => {
        if (!this.groupSorts || this.groupSorts.length <= 0) {
          this.statuses = data;
        } else {
          for (let status of data) {
            status.Weight = this.getSortWeightForGroup(status.GroupId);
          }

          this.statuses = data;

          this.statuses.sort(function (a, b) {
            return (a.Weight - b.Weight);
          });
        }
      });
  }
}