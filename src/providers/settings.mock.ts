import { Injectable, Inject } from '@angular/core';
import 'rxjs/add/operator/map';

import { APP_CONFIG_TOKEN, AppConfig } from "../config/app.config-interface";
import { Consts } from '../app/consts';
import { Widget } from '../models/widget';
import { Settings } from '../models/settings';
import { CallsWidgetSettings } from '../models/callsWidgetSettings';
import { PersonnelWidgetSettings } from '../models/personnelWidgetSettings';
import { UnitsWidgetSettings } from '../models/unitsWidgetSettings';
import { GroupSorting } from '../models/groupSorting';
import { WeatherWidgetSettings } from '../models/weatherWidgetSettings';
import { MapWidgetSettings } from '../models/mapWidgetSettings';

@Injectable()
export class SettingsProviderMock {

  public isAuthenticated: boolean = false;
  public settings: Settings;

  constructor() {
    this.settings = new Settings();
  }

  public init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        resolve(true);
    });
  }

  public areSettingsSet(): boolean {
      return true;
  }

  public getUserId(): string {
    return "";
  }

  public setUserId(userId: string): void {
    return;
  }

  public getUsername(): string {
    return "";
  }

  public setUsername(userName: string): void {
    return;
  }

  public getPassword(): string {
    return "";
  }

  public setPassword(password: string): void {
    return;
  }

  public getDepartmentId(): number {
    return 1;
  }

  public setDepartmentId(departmentId: number): void {
    return;
  }

  public getAuthToken(): string {
    return "";
  }

  public setAuthToken(authToken: string): void {
    return;
  }

  public getAuthTokenExpiry(): string {
    return "";
  }

  public setAuthTokenExpiry(authTokenExpiry: string): void {
    return;
  }

  public getFullName(): string {
    return "";
  }

  public setFullName(name: string): void {
    return;
  }

  public getEmail(): string {
    return "";
  }

  public setEmail(email: string): void {
    return;
  }

  public getEnableDetailedResponses(): boolean {
    return true;
  }

  public setEnableDetailedResponses(enableDetailedResponses: boolean): void {
    return;
  }

  public getEnableGeolocation(): boolean {
    return true;
  }

  public setEnableGeolocation(enableGeolocation: boolean): void {
    return;
  }

  public getEnablePushNotifications(): boolean {
    return true;
  }

  public setEnablePushNotifications(enablePushNotifications: boolean): void {
    return;
  }

  public getPushDeviceUriId(): string {
    return "";
  }

  public setPushDeviceUriId(pushDeviceUriId: string): void {
    return;
  }

  public getPersonnelFilter(): string {
    return "";
  }

  public setPersonnelFilter(personnelFilter: string): void {
    return;
  }

  public getUnitsFilter(): string {
    return "";
  }

  public setUnitsFilter(unitsFilter: string): void {
    return;
  }

  public getDepartmentName(): string {
    return "";
  }

  public setDepartmentName(departmentName: string): void {
    return;
  }

  public getDepartmentCreatedOn(): string {
    return "";
  }

  public setDepartmentCreatedOn(departmentCreatedOn: string): void {
    return;
  }

  public getSortRespondingTop(): boolean {
    return true;
  }

  public setSortRespondingTop(sortRespondingTop: boolean): void {
    return;
  }

  public getEnableCustomSounds(): boolean {
    return true;
  }

  public setEnableCustomSounds(enableCustomSounds: boolean): void {
    return;
  }

  public getCustomRespondingText(): string {
    return "";
  }

  public setCustomRespondingText(customRespondingText: string): void {
    return;
  }

  public setAuthenticated(authenticated: boolean): void {
    return;
  }

  public getLanguage(): string {
    return "";
  }

  public setLanguage(language: string): void {
    return;
  }

  public save(): Promise<Settings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveGroupSorting(weights: Array<GroupSorting>): Promise<Array<GroupSorting>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadGroupSorting(): Promise<Array<GroupSorting>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveGroupHiding(groupHides: Array<number>): Promise<Array<number>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadGroupHiding(): Promise<Array<number>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveLayout(widgets: Array<Widget>): Promise<Array<Widget>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadLayout(): Promise<Array<Widget>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public clearLayout(): void {
    return;
  }

  public saveCallWidgetSettings(callWidgetSettings: CallsWidgetSettings): Promise<CallsWidgetSettings> {
   return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadCallWidgetSettings(): Promise<CallsWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public savePersonnelWidgetSettings(personnelWidgetSettings: PersonnelWidgetSettings): Promise<PersonnelWidgetSettings> {
   return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadPersonnelWidgetSettings(): Promise<PersonnelWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveUnitsWidgetSettings(unitsWidgetSettings: UnitsWidgetSettings): Promise<UnitsWidgetSettings> {
   return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadUnitsWidgetSettings(): Promise<UnitsWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveUnitGroupSorting(weights: Array<GroupSorting>): Promise<Array<GroupSorting>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadUnitGroupSorting(): Promise<Array<GroupSorting>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveUnitGroupHiding(groupHides: Array<number>): Promise<Array<number>> {
   return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadUnitGroupHiding(): Promise<Array<number>> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveWeatherWidgetSettings(weatherWidgetSettings: WeatherWidgetSettings): Promise<WeatherWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadWeatherWidgetSettings(): Promise<WeatherWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public saveMapWidgetSettings(mapWidgetSettings: MapWidgetSettings): Promise<MapWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }

  public loadMapWidgetSettings(): Promise<MapWidgetSettings> {
    return new Promise((resolve, reject) => {
        resolve(null);
    });
  }
}