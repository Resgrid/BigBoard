import { Injectable } from '@angular/core';
import localForage from "localforage";
import 'rxjs/add/operator/map';

import { Consts } from '../app/consts';
import { Widget } from '../models/widget';
import { Settings } from '../models/settings';
import { CallsWidgetSettings } from '../models/callsWidgetSettings';
import { PersonnelWidgetSettings } from '../models/personnelWidgetSettings';

@Injectable()
export class SettingsProvider {

    public isAuthenticated: boolean = false;
    public settings: Settings;
    private localStorage: LocalForage;

    constructor(private consts: Consts) {
      this.localStorage = localForage.createInstance({
            driver      : localForage.LOCALSTORAGE,
            name        : 'BigBoard',
            version     : '1.0',
            storeName   : 'RGBigBoardSettings',
            description : 'Resgrid BigBoard Settings Store'
      });

      this.settings = new Settings();
    }

    public init(): Promise<boolean> {
        let that: any = this;

        return new Promise((resolve, reject) => {
            this.localStorage.getItem("settings").then(function result(savedSettings: Settings)
            {
                if (savedSettings) {
                  if (savedSettings.AuthToken) {
                    that.setAuthenticated(true);
                  }

                  that.settings = savedSettings;
                }

                resolve(true);
            }).catch(function (err) {
              that.settings = new Settings();
            });
        });
    }

  public areSettingsSet(): boolean {
			if (this.consts.IsDemo === true) {
				return true;
			} else {
				if (!this.settings.Username)
					return false;

				if (!this.settings.Password)
					return false;

				return true;
			}
		}

   public getUserId(): string {
     return this.settings.UserId;
   }

   public setUserId(userId: string): void {
     this.settings.UserId = userId;
     this.save();
   }

   public getUsername(): string {
     return this.settings.Username;
   }

   public setUsername(userName: string): void {
     this.settings.Username = userName;
     this.save();
   }

   public getPassword(): string {
     return this.settings.Password;
   }

   public setPassword(password: string): void {
     this.settings.Password = password;
     this.save();
   }

   public getDepartmentId(): number {
     return this.settings.DepartmentId;
   }

   public setDepartmentId(departmentId: number): void {
     this.settings.DepartmentId = departmentId;
     this.save();
   }

   public getAuthToken(): string {
       return this.settings.AuthToken;
   }

   public setAuthToken(authToken: string): void {
     this.settings.AuthToken = authToken;
     this.save();
   }

   public getAuthTokenExpiry(): string {
     return this.settings.AuthTokenExpiry;
   }

   public setAuthTokenExpiry(authTokenExpiry: string): void {
     this.settings.AuthTokenExpiry = authTokenExpiry;
     this.save();
   }

   public getFullName(): string {
       return this.settings.FullName;
   }

   public setFullName(name: string): void {
     this.settings.FullName = name;
     this.save();
   }

   public getEmail(): string {
      return this.settings.EmailAddress;
   }

   public setEmail(email: string): void {
     this.settings.EmailAddress = email;
     this.save();
   }

   public getEnableDetailedResponses(): boolean {
     return this.settings.EnableDetailedResponses;
   }

   public setEnableDetailedResponses(enableDetailedResponses: boolean): void {
     this.settings.EnableDetailedResponses = enableDetailedResponses;
     this.save();
   }

   public getEnableGeolocation(): boolean {
     return this.settings.EnableGeolocation;
   }

   public setEnableGeolocation(enableGeolocation: boolean): void {
     this.settings.EnableGeolocation = enableGeolocation;
     this.save();
   }

   public getEnablePushNotifications(): boolean {
     return this.settings.EnablePushNotifications;
   }

   public setEnablePushNotifications(enablePushNotifications: boolean): void {
     this.settings.EnablePushNotifications = enablePushNotifications;
     this.save();
   }

   public getPushDeviceUriId(): string {
     return this.settings.PushDeviceUriId;
   }

   public setPushDeviceUriId(pushDeviceUriId: string): void {
     this.settings.PushDeviceUriId = pushDeviceUriId;
     this.save();
   }

   public getPersonnelFilter(): string {
     return this.settings.PersonnelFilter;
   }

   public setPersonnelFilter(personnelFilter: string): void {
     this.settings.PersonnelFilter = personnelFilter;
     this.save();
   }

   public getUnitsFilter(): string {
     return this.settings.UnitsFilter;
   }

   public setUnitsFilter(unitsFilter: string): void {
     this.settings.UnitsFilter = unitsFilter;
     this.save();
   }

   public getDepartmentName(): string {
     return this.settings.DepartmentName;
   }

   public setDepartmentName(departmentName: string): void {
     this.settings.DepartmentName = departmentName;
     this.save();
   }

   public getDepartmentCreatedOn(): string {
     return this.settings.DepartmentCreatedOn;
   }

   public setDepartmentCreatedOn(departmentCreatedOn: string): void {
     this.settings.DepartmentCreatedOn = departmentCreatedOn;
     this.save();
   }

   public getSortRespondingTop(): boolean {
     return this.settings.SortRespondingTop;
   }

   public setSortRespondingTop(sortRespondingTop: boolean): void {
     this.settings.SortRespondingTop = sortRespondingTop;
     this.save();
   }

   public getEnableCustomSounds(): boolean {
     return this.settings.EnableCustomSounds;
   }

   public setEnableCustomSounds(enableCustomSounds: boolean): void {
     this.settings.EnableCustomSounds = enableCustomSounds;
     this.save();
   }

   public getCustomRespondingText(): string {
     return this.settings.CustomRespondingText;
   }

   public setCustomRespondingText(customRespondingText: string): void {
     this.settings.CustomRespondingText = customRespondingText;
     this.save();
   }

   public setAuthenticated(authenticated: boolean): void {
       this.isAuthenticated = authenticated;
   }

   public getLanguage(): string {
     return this.settings.Language;
   }

   public setLanguage(language: string): void {
     this.settings.Language = language;
     this.save();
   }

   public save(): Promise<Settings> {
     return this.localStorage.setItem('settings', this.settings);
   }

   public saveLayout(widgets: Array<Widget>): Promise<Array<Widget>> {
     return this.localStorage.setItem('widgets', widgets);
   }

   public loadLayout(): Promise<Array<Widget>> {
      return this.localStorage.getItem("widgets");
   }

   public clearLayout(): void {
      this.localStorage.removeItem("widgets");
   }

   public saveCallWidgetSettings(callWidgetSettings: CallsWidgetSettings): Promise<CallsWidgetSettings> {
     return this.localStorage.setItem('callWidgetSettings', callWidgetSettings);
   }

   public loadCallWidgetSettings(): Promise<CallsWidgetSettings> {
      return this.localStorage.getItem("callWidgetSettings");
   }

   public savePersonnelWidgetSettings(personnelWidgetSettings: PersonnelWidgetSettings): Promise<PersonnelWidgetSettings> {
     return this.localStorage.setItem('personnelWidgetSettings', personnelWidgetSettings);
   }

   public loadPersonnelWidgetSettings(): Promise<PersonnelWidgetSettings> {
      return this.localStorage.getItem("personnelWidgetSettings");
   }
}
