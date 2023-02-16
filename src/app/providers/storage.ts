import { Injectable } from '@angular/core';
import { UtilsService } from '@resgrid/ngx-resgridlib';
import { StartupData } from '../features/settings/models/startupData';
import { LoginResult } from '../models/loginResult';
import { Preferences } from '@capacitor/preferences';
import { GroupSorting } from '../models/groupSorting';
import { CallsWidgetSettings } from '../models/callsWidgetSettings';
import { PersonnelWidgetSettings } from '../models/personnelWidgetSettings';
import { UnitsWidgetSettings } from '../models/unitsWidgetSettings';
import { WeatherWidgetSettings } from '../models/weatherWidgetSettings';
import { NotesWidgetSettings } from '../models/notesWidgetSettings';
import { MapWidgetSettings } from '../models/mapWidgetSettings';
import { Widget } from '../models/widget';

@Injectable({
  providedIn: 'root',
})
export class StorageProvider {
  constructor(private utilsService: UtilsService) {}

  async init() {
    //await Storage.create();
    await this.initDeviceId();
  }

  private async set(key: string, value: string): Promise<any> {
    return await Preferences?.set({
      key: key,
      value: value,
    });
  }

  private async get(key: string): Promise<any> {
    const { value } = await Preferences?.get({ key: key });

    return value;
  }

  public async clear(): Promise<any> {
    return await Preferences?.clear();
  }

  private async initDeviceId(): Promise<void> {
    const deviceId = await this.get('RGBBDeviceId');

    if (!deviceId) {
      const newDeviceId = this.utilsService.generateUUID();
      await this.set('RGBBDeviceId', newDeviceId);
    }
  }

  public async getServerAddress(): Promise<string> {
    return await this.get('RGBBserverAddress');
  }

  public async setServerAddress(serverAddress: string): Promise<any> {
    return await this.set('RGBBserverAddress', serverAddress);
  }

  public async getDeviceId(): Promise<string> {
    return await this.get('RGBBDeviceId');
  }

  public async setLoginData(loginData: LoginResult): Promise<any> {
    await this.set('RGBBLoginData', JSON.stringify(loginData));

    return loginData
  }

  public async getLoginData(): Promise<LoginResult> {
    return JSON.parse(await this.get('RGBBLoginData'));
  }

  public async setPerferDarkMode(perferDark: number): Promise<any> {
    await this.set('RGBBPerferDark', perferDark?.toString());

    return perferDark;
  }

  public async setKeepAlive(keepAlive: boolean): Promise<any> {
    return await this.set('RGBBKeepAlive', keepAlive?.toString());
  }

  public async getPerferDarkMode(): Promise<number> {
    let data = await this.get('RGBBPerferDark');
    if (data) {
      return parseInt(data);
    }

    return -1;
  }

  public async getKeepAlive(): Promise<boolean> {
    let data = await this.get('RGBBKeepAlive');
    if (data) {
      let isSet = (data === 'true');
      return isSet;
    }

    return false;
  }

  public async getStartupData(): Promise<StartupData> {
    const loginData = await this.getLoginData();
    const darkMode = await this.getPerferDarkMode();
    const keepAlive = await this.getKeepAlive();

    return {
      loginData: loginData,
      perferDarkMode: darkMode,
      keepAlive: keepAlive,
    };
  }

  public async saveGroupSorting(weights: Array<GroupSorting>): Promise<Array<GroupSorting>> {
    return await this.set('RGBBgroupWeights', weights.toString());
  }

  public async loadGroupSorting(): Promise<Array<GroupSorting>> {
    return await this.get("RGBBgroupWeights");
  }

  public async saveGroupHiding(groupHides: Array<number>): Promise<Array<number>> {
    return await this.set('RGBBgroupHides', JSON.stringify(groupHides));
  }

  public async loadGroupHiding(): Promise<Array<number>> {
    return await this.get("RGBBgroupHides");
  }

  public async saveLayout(widgets: Array<Widget>): Promise<Array<Widget>> {
    return await this.set('RGBBwidgets', JSON.stringify(widgets));
  }

  public async loadLayout(): Promise<Array<Widget>> {
    const widgets = await this.get("RGBBwidgets");

    if (widgets) {
      return JSON.parse(widgets);
    }

    return [];
  }

  public async clearLayout(): Promise<any> {
    return await this.set("RGBBwidgets", '');
  }

  public async saveCallWidgetSettings(callWidgetSettings: CallsWidgetSettings): Promise<CallsWidgetSettings> {
    await this.set('RGBBcallWidgetSettings', JSON.stringify(callWidgetSettings));
    return callWidgetSettings;
  }

  public async loadCallWidgetSettings(): Promise<CallsWidgetSettings | null> {
    const result = await this.get("RGBBcallWidgetSettings");

    if (result) {
      return JSON.parse(result);
    }

    return null;
  }

  public async savePersonnelWidgetSettings(personnelWidgetSettings: PersonnelWidgetSettings): Promise<PersonnelWidgetSettings> {
    await this.set('RGBBpersonnelWidgetSettings', JSON.stringify(personnelWidgetSettings));

    return personnelWidgetSettings;
  }

  public async loadPersonnelWidgetSettings(): Promise<PersonnelWidgetSettings | null> {
    const result = await this.get("RGBBpersonnelWidgetSettings");

    if (result) {
      return JSON.parse(result);
    }

    return null;
  }

  public async saveUnitsWidgetSettings(unitsWidgetSettings: UnitsWidgetSettings): Promise<UnitsWidgetSettings> {
    return await this.set('RGBBunitsWidgetSettings', JSON.stringify(unitsWidgetSettings));
  }

  public async loadUnitsWidgetSettings(): Promise<UnitsWidgetSettings> {
    return await this.get("RGBBunitsWidgetSettings");
  }

  public async saveUnitGroupSorting(weights: Array<GroupSorting>): Promise<Array<GroupSorting>> {
    return await this.set('RGBBunitGroupWeights', JSON.stringify(weights));
  }

  public async loadUnitGroupSorting(): Promise<Array<GroupSorting>> {
    return await this.get("RGBBunitGroupWeights");
  }

  public async saveUnitGroupHiding(groupHides: Array<number>): Promise<Array<number>> {
    return await this.set('RGBBunitGroupHides', JSON.stringify(groupHides));
  }

  public async loadUnitGroupHiding(): Promise<Array<number>> {
    return await this.get("RGBBunitGroupHides");
  }

  public async saveWeatherWidgetSettings(weatherWidgetSettings: WeatherWidgetSettings): Promise<WeatherWidgetSettings> {
    await this.set('RGBBweatherWidgetSettings', JSON.stringify(weatherWidgetSettings));
    return weatherWidgetSettings;
  }

  public async loadWeatherWidgetSettings(): Promise<WeatherWidgetSettings | null> {
    const result = await this.get("RGBBweatherWidgetSettings");

    if (result) {
      return JSON.parse(result);
    }

    return null;
  }

  public async saveNotesWidgetSettings(notesWidgetSettings: NotesWidgetSettings): Promise<NotesWidgetSettings> {
    return await this.set('RGBBnotesWidgetSettings', JSON.stringify(notesWidgetSettings));
  }

  public async loadNotesWidgetSettings(): Promise<NotesWidgetSettings> {
    return await this.get("RGBBnotesWidgetSettings");
  }

  public async saveMapWidgetSettings(mapWidgetSettings: MapWidgetSettings): Promise<MapWidgetSettings> {
    await this.set('RGBBmapWidgetSettings', JSON.stringify(mapWidgetSettings));
    return mapWidgetSettings;
  }

  public async loadMapWidgetSettings(): Promise<MapWidgetSettings | null> {
    const result = await this.get("RGBBmapWidgetSettings");

    if (result) {
      return JSON.parse(result);
    }

    return null;
  }
}
