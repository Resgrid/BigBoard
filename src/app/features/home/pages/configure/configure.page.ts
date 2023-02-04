import { Component, OnInit, Output } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { SettingsState } from '../../../settings/store/settings.store';
import * as SettingsActions from '../../../settings/actions/settings.actions';
import { Observable, Subscription } from 'rxjs';
import { HomeState } from '../../store/home.store';
import {
  selectHomeState,
  selectKeepAliveState,
  selectPerferDarkModeState,
  selectSettingsState,
  selectWidgetsState,
} from 'src/app/store';
import { SubSink } from 'subsink';
import { SleepProvider } from 'src/app/providers/sleep';
import { OpenViduDevicesService } from 'src/app/providers/openviduDevices';
import { IDevice } from 'src/app/models/deviceType';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import { GroupSorting } from 'src/app/models/groupSorting';
import * as HomeActions from '../../actions/home.actions';
import * as WidgetActions from '../../../widgets/actions/widgets.actions';
import { WidgetsState } from 'src/app/features/widgets/store/widgets.store';
import { MapWidgetSettings } from 'src/app/models/mapWidgetSettings';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';
import { UnitsWidgetSettings } from 'src/app/models/unitsWidgetSettings';
import { CallsWidgetSettings } from 'src/app/models/callsWidgetSettings';
import { NotesWidgetSettings } from 'src/app/models/notesWidgetSettings';

@Component({
  selector: 'app-home-configure',
  templateUrl: './configure.page.html',
  styleUrls: ['./configure.page.scss'],
})
export class ConfigurePage implements OnInit {
  public homeState$: Observable<HomeState | null>;
  public widgetsState$: Observable<WidgetsState | null>;
  private subs = new SubSink();
  public tabType: string = 'personnel';

  public personnelWidgetSettings: PersonnelWidgetSettings =
    new PersonnelWidgetSettings();
  public personnelWidgetGroupSorts: GroupSorting[] = new Array<GroupSorting>();
  public personnelWidgetGroupHides: string[] = new Array<string>();

  public mapWidgetSettings: MapWidgetSettings = new MapWidgetSettings();

  public weatherWidgetSettings: WeatherWidgetSettings = new WeatherWidgetSettings();
  public weatherUnits: string[];

  public unitsWidgetSettings: UnitsWidgetSettings = new UnitsWidgetSettings();
  public unitsWidgetGroupSorts: GroupSorting[] = new Array<GroupSorting>();
  public unitsWidgetGroupHides: string[] = new Array<string>();

  public callsWidgetSettings: CallsWidgetSettings = new CallsWidgetSettings();

  public notesWidgetSettings: NotesWidgetSettings = new NotesWidgetSettings();
  public noteCategories: string[] = new Array<string>();

  constructor(
    public menuCtrl: MenuController,
    private widgetsStore: Store<WidgetsState>,
    private homeStore: Store<HomeState>,
    private sleepProvider: SleepProvider,
    private platform: Platform,
    private deviceService: OpenViduDevicesService
  ) {
    this.homeState$ = this.homeStore.select(selectHomeState);
    this.widgetsState$ = this.widgetsStore.select(selectWidgetsState);

    this.weatherUnits = new Array<string>('standard', 'metric', 'imperial');
    this.noteCategories.push('None');
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.subs.sink = this.widgetsState$.subscribe((widgetSettings) => {
      if (widgetSettings) {
        if (widgetSettings.personnelWidgetSettings) {
          this.personnelWidgetSettings = widgetSettings.personnelWidgetSettings;
        }
      }
    });

    this.homeStore.dispatch(new HomeActions.GetGroups());
    this.widgetsStore.dispatch(new WidgetActions.LoadAllWidgetSettings());
  }

  async ionViewDidEnter() {}

  ionViewWillLeave() {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  public getSortWeightForGroup(groupId: string): number {
    for (let group of this.personnelWidgetGroupSorts) {
      if (group.GroupId == groupId) {
        return group.Weight;
      }
    }

    return 10;
  }

  public setSortWeightForGroup(groupId: string, event: any): void {
    let groupSort: GroupSorting;

    for (let group of this.personnelWidgetGroupSorts) {
      if (group.GroupId == groupId) {
        group.Weight = event.target.value;
        groupSort = group;

        return;
      }
    }

    groupSort = new GroupSorting();
    groupSort.GroupId = groupId;
    groupSort.Weight = event.target.value;

    this.personnelWidgetGroupSorts.push(groupSort);
  }

  public getIsHiddenForGroup(groupId: string): boolean {
    for (let group of this.personnelWidgetGroupHides) {
      if (group == groupId) {
        return true;
      }
    }

    return false;
  }

  public setIsHiddenForGroup(groupId: string, event: any): void {
    let isHidden: boolean = event.checked;
    let index = this.personnelWidgetGroupHides.indexOf(groupId, 0);

    if (isHidden && index <= -1) {
      this.personnelWidgetGroupHides.push(groupId);
    } else if (!isHidden && index > -1) {
      this.personnelWidgetGroupHides.splice(index, 1);
    }
  }

  public getGroupWidgetSortWeightForGroup(groupId: string): number {
    for (let group of this.unitsWidgetGroupSorts) {
      if (group.GroupId == groupId) {
        return group.Weight;
      }
    }

    return 10;
  }

  public setGroupWidgetSortWeightForGroup(groupId: string, event: any): void {
    let groupSort: GroupSorting;

    for (let group of this.unitsWidgetGroupSorts) {
      if (group.GroupId == groupId) {
        group.Weight = event.target.value;
        groupSort = group;

        return;
      }
    }

    groupSort = new GroupSorting();
    groupSort.GroupId = groupId;
    groupSort.Weight = event.target.value;

    this.unitsWidgetGroupSorts.push(groupSort);
  }

  public getGroupWidgetIsHiddenForGroup(groupId: string): boolean {
    for (let group of this.unitsWidgetGroupHides) {
      if (group == groupId) {
        return true;
      }
    }

    return false;
  }

  public setGroupWidgetIsHiddenForGroup(groupId: string, event: any): void {
    let isHidden: boolean = event.checked;
    let index = this.unitsWidgetGroupHides.indexOf(groupId, 0);

    if (isHidden && index <= -1) {
      this.unitsWidgetGroupHides.push(groupId);
    } else if (!isHidden && index > -1) {
      this.unitsWidgetGroupHides.splice(index, 1);
    }
  }

  public savePersonnelWidgetSettings() {}

  public saveMapWidgetSettings() {}

  public saveWeatherWidgetSettings() {}

  public saveUnitWidgetSettings() {}

  public saveCallWidgetSettings() {}

  public saveNoteWidgetSettings() {}
}
