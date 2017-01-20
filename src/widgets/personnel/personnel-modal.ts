import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { PersonnelWidgetSettings } from '../../models/personnelWidgetSettings';
import { GroupSorting } from '../../models/groupSorting';
import { GroupResult } from '../../models/groupResult';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings';

@Component({
  selector: 'personnel-modal',
  templateUrl: 'personnel-modal.html'
})
export class PersonnelModal {
  public model: PersonnelWidgetSettings;
  public groupSorts: GroupSorting[] = new Array<GroupSorting>();
  public groupHides: number[] = new Array<number>();

  private removeWidget;
  private closeModal;
  private groups: GroupResult[] = new Array<GroupResult>();

  constructor(private navParams: NavParams,
    private consts: Consts,
    private dataProvider: DataProvider,
    private settingsProvider: SettingsProvider,
    private widgetPubSub: WidgetPubSub) {
    this.removeWidget = this.navParams.get('removeWidget')
    this.closeModal = this.navParams.get('closeModal')

    this.model = new PersonnelWidgetSettings();
  }

  ngOnInit() {
    this.fetch();

    this.settingsProvider.loadPersonnelWidgetSettings().then((settings) => {
      if (settings) {
        this.model = settings;
      }
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
  }

  save() {
    this.settingsProvider.savePersonnelWidgetSettings(this.model).then(() => {
      this.widgetPubSub.emitPersonnelWidgetSettingsUpdated(this.model);

      this.settingsProvider.saveGroupSorting(this.groupSorts).then(() => {
        this.widgetPubSub.emitPersonnelWidgetSortUpdated(this.groupSorts);

        this.settingsProvider.saveGroupHiding(this.groupHides).then(() => {
          this.widgetPubSub.emitPersonnelWidgetHideUpdated(this.groupHides);

          this.closeModal();
        });
      });
    });
  }

  remove() {
    this.removeWidget(this.consts.WIDGET_TYPES.PERSONNEL);
  }

  close() {
    this.closeModal();
  }

  public getSortWeightForGroup(groupId: number): number {
    for (let group of this.groupSorts) {
      if (group.GroupId == groupId) {
        return group.Weight;
      }
    }

    return 10;
  }

  public setSortWeightForGroup(groupId: number, event: any): void {
    let groupSort: GroupSorting;

    for (let group of this.groupSorts) {
      if (group.GroupId == groupId) {
        group.Weight = event.target.value;
        groupSort = group;
      }
    }

    if (!groupSort) {
      groupSort = new GroupSorting();
      groupSort.GroupId = groupId;
      groupSort.Weight = event.target.value;

      this.groupSorts.push(groupSort);
    }
  }

  public getIsHiddenForGroup(groupId: number): boolean {
    for (let group of this.groupHides) {
      if (group == groupId) {
        return true;
      }
    }

    return false;
  }

  public setIsHiddenForGroup(groupId: number, event: any): void {
    let isHidden: boolean = event.checked;
    let index = this.groupHides.indexOf(groupId, 0);

    if (isHidden && index <= -1) {
      this.groupHides.push(groupId);
    } else if (!isHidden && index > -1) {
      this.groupHides.splice(index, 1);
    }
  }

  private fetch() {
    this.dataProvider.getGroups().subscribe(
      data => {
        this.groups = data;
      });
  }
}