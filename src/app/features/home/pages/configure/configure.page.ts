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
import * as _ from 'lodash';

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

  public personnelWidgetSettings: PersonnelWidgetSettings = new PersonnelWidgetSettings();

  public mapWidgetSettings: MapWidgetSettings = new MapWidgetSettings();

  public weatherWidgetSettings: WeatherWidgetSettings = new WeatherWidgetSettings();
  public weatherUnits: string[];

  public unitsWidgetSettings: UnitsWidgetSettings = new UnitsWidgetSettings();

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
          this.personnelWidgetSettings = _.cloneDeep(widgetSettings.personnelWidgetSettings);

          if (this.personnelWidgetSettings.SortOrders == null) {
            this.personnelWidgetSettings.SortOrders = new Array<GroupSorting>();
          }

          if (this.personnelWidgetSettings.HideGroups == null) {
            this.personnelWidgetSettings.HideGroups = new Array<string>();
          }
        }

        if (widgetSettings.mapWidgetSettings) {
          this.mapWidgetSettings = _.cloneDeep(widgetSettings.mapWidgetSettings);
        }

        if (widgetSettings.weatherWidgetSettings) {
          this.weatherWidgetSettings = _.cloneDeep(widgetSettings.weatherWidgetSettings);
        }

        if (widgetSettings.unitsWidgetSettings) {
          this.unitsWidgetSettings = _.cloneDeep(widgetSettings.unitsWidgetSettings);
        }

        if (widgetSettings.callsWidgetSettings) {
          this.callsWidgetSettings = _.cloneDeep(widgetSettings.callsWidgetSettings);
        }

        if (widgetSettings.notesWidgetSettings) {
          this.notesWidgetSettings = _.cloneDeep(widgetSettings.notesWidgetSettings);
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
    if (this.personnelWidgetSettings && this.personnelWidgetSettings.SortOrders) {
      for (let group of this.personnelWidgetSettings.SortOrders) {
        if (group.GroupId == groupId) {
          return group.Weight;
        }
      }
    }

    return 10;
  }

  public setSortWeightForGroup(groupId: string, event: any): void {
    let groupSort: GroupSorting;

    for (let group of this.personnelWidgetSettings.SortOrders) {
      if (group.GroupId == groupId) {
        group.Weight = event.target.value;
        groupSort = group;

        return;
      }
    }

    groupSort = new GroupSorting();
    groupSort.GroupId = groupId;
    groupSort.Weight = event.target.value;

    this.personnelWidgetSettings.SortOrders.push(groupSort);
  }

  public getIsHiddenForGroup(groupId: string): boolean {
    if (this.personnelWidgetSettings && this.personnelWidgetSettings.HideGroups) {
      for (let group of this.personnelWidgetSettings.HideGroups) {
        if (group == groupId) {
          return true;
        }
      }
    }

    return false;
  }

  public setIsHiddenForGroup(groupId: string, event: any): void {
    let isHidden: boolean = event.checked;
    let index = this.personnelWidgetSettings.HideGroups.indexOf(groupId, 0);

    if (isHidden && index <= -1) {
      this.personnelWidgetSettings.HideGroups.push(groupId);
    } else if (!isHidden && index > -1) {
      this.personnelWidgetSettings.HideGroups.splice(index, 1);
    }
  }

  public getGroupWidgetSortWeightForGroup(groupId: string): number {
    if (this.unitsWidgetSettings && this.unitsWidgetSettings.SortOrders) {
      for (let group of this.unitsWidgetSettings.SortOrders) {
        if (group.GroupId == groupId) {
          return group.Weight;
        }
      }
    }

    return 10;
  }

  public setGroupWidgetSortWeightForGroup(groupId: string, event: any): void {
    let groupSort: GroupSorting;

    for (let group of this.unitsWidgetSettings.SortOrders) {
      if (group.GroupId == groupId) {
        group.Weight = event.target.value;
        groupSort = group;

        return;
      }
    }

    groupSort = new GroupSorting();
    groupSort.GroupId = groupId;
    groupSort.Weight = event.target.value;

    this.unitsWidgetSettings.SortOrders.push(groupSort);
  }

  public getGroupWidgetIsHiddenForGroup(groupId: string): boolean {
    if (this.unitsWidgetSettings && this.unitsWidgetSettings.HideGroups) {
      for (let group of this.unitsWidgetSettings.HideGroups) {
        if (group == groupId) {
          return true;
        }
      }
    }

    return false;
  }

  public setGroupWidgetIsHiddenForGroup(groupId: string, event: any): void {
    let isHidden: boolean = event.checked;
    let index = this.unitsWidgetSettings.HideGroups.indexOf(groupId, 0);

    if (isHidden && index <= -1) {
      this.unitsWidgetSettings.HideGroups.push(groupId);
    } else if (!isHidden && index > -1) {
      this.unitsWidgetSettings.HideGroups.splice(index, 1);
    }
  }

  public savePersonnelWidgetSettings() {
    this.widgetsStore.dispatch(new WidgetActions.SetPersonnelSettings(this.personnelWidgetSettings));
  }

  public saveMapWidgetSettings() {
    this.widgetsStore.dispatch(new WidgetActions.SetMapSettings(this.mapWidgetSettings));
  }

  public saveWeatherWidgetSettings() {
    this.widgetsStore.dispatch(new WidgetActions.SetWeatherSettings(this.weatherWidgetSettings));
  }

  public saveUnitWidgetSettings() {
    this.widgetsStore.dispatch(new WidgetActions.SetUnitSettings(this.unitsWidgetSettings));
  }

  public saveCallWidgetSettings() {
    this.widgetsStore.dispatch(new WidgetActions.SetCallsSettings(this.callsWidgetSettings));
  }

  public saveNoteWidgetSettings() {
    this.widgetsStore.dispatch(new WidgetActions.SetNotesSettings(this.notesWidgetSettings));
  }
}
