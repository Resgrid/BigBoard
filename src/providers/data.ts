import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { Observable } from "rxjs/Observable";

import { Consts } from '../app/consts';
import { UtilsProvider } from './utils';

import { APP_CONFIG_TOKEN, AppConfig } from "../config/app.config-interface";
import { PersonnelStatusResult } from '../models/personnelStatusResult';
import { MapResult } from '../models/mapResult';
import { MapMakerInfo } from '../models/mapMakerInfo';
import { WeatherResult } from '../models/weatherResult';
import { UnitStatusResult } from '../models/unitStatusResult';
import { CallResult } from '../models/callResult';
import { GroupResult } from '../models/groupResult';
import { DepartmentLinkResult } from '../models/departmentLinkResult';
import { GroupsModel } from '../models/groupsModel';
import { LinkedCallResult } from '../models/linkedCallResult';

@Injectable()
export class DataProvider {
    constructor(private http: HttpClient, private consts: Consts,
        private utils: UtilsProvider,
        @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig) {

    }

    public getPersonnelStatuses(): Observable<PersonnelStatusResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/BigBoard/GetPersonnelStatuses';

        return this.http.get<PersonnelStatusResult[]>(url).map((items) => {
            let statuses: PersonnelStatusResult[] = new Array<PersonnelStatusResult>();

            if (items) {
                items.forEach(item => {
                    let status = new PersonnelStatusResult();
                    status.Name = item.Name;
                    status.Status = item.Status;
                    status.StatusCss = item.StatusCss;
                    status.State = item.State;
                    status.StateCss = item.StateCss;
                    status.UpdatedDate = item.UpdatedDate;
                    status.Group = item.Group;
                    status.Roles = item.Roles;
                    status.GroupId = item.GroupId;
                    status.StateStyle = item.StateStyle;
                    status.StatusStyle = item.StatusStyle;
                    status.Latitude = item.Latitude;
                    status.Longitude = item.Longitude;
                    status.StatusValue = item.StatusValue;
                    status.Eta = item.Eta;
                    status.DestinationType = item.DestinationType;

                    statuses.push(status);
                });
            }

            return statuses;
        });
    }

    public getMap(): Observable<MapResult> {
        let url = this.appConfig.ResgridApiUrl + '/BigBoard/GetMap';

        return this.http.get<MapResult>(url).map((item) => {
            let mapResult: MapResult = new MapResult();
            mapResult.MapMakerInfos = new Array<MapMakerInfo>();

            if (item) {
                mapResult.CenterLat = item.CenterLat;
                mapResult.CenterLon = item.CenterLon;
                mapResult.ZoomLevel = item.ZoomLevel;

                if (item.MapMakerInfos) {
                    item.MapMakerInfos.forEach(makerInfo => {
                        let marker = new MapMakerInfo();
                        marker.Longitude = makerInfo.Longitude;
                        marker.Latitude = makerInfo.Latitude;
                        marker.Title = makerInfo.Title;
                        marker.zIndex = makerInfo.zIndex;
                        marker.ImagePath = makerInfo.ImagePath;
                        marker.InfoWindowContent = makerInfo.InfoWindowContent;

                        mapResult.MapMakerInfos.push(marker);
                    });
                }
            }

            return mapResult;
        });
    }

    public getWeather(): Observable<WeatherResult> {
        let url = this.appConfig.ResgridApiUrl + '/BigBoard/GetWeather';

        return this.http.get<WeatherResult>(url).map((item) => {
            let weatherResult: WeatherResult = new WeatherResult();

            weatherResult.WeatherUnit = item.WeatherUnit;
            weatherResult.Longitude = item.Longitude;
            weatherResult.Latitude = item.Latitude;

            return weatherResult;
        });
    }

    public getUnitStatuses(): Observable<UnitStatusResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/BigBoard/GetUnitStatuses';

        return this.http.get<UnitStatusResult[]>(url).map((items) => {
            let statuses: UnitStatusResult[] = new Array<UnitStatusResult>();

            if (items) {
                items.forEach(item => {
                    let status = new UnitStatusResult();
                    status.Name = item.Name;
                    status.State = item.State;

                    if (item.StateCss.indexOf('#') > -1) {
                        //status.StateCss = 'label-default';
                        status.StateCss = '';
                        status.StateStyle = item.StateStyle;

                    } else {
                        status.StateCss = item.StateCss;
                        status.StateStyle = '#000000';
                    }

                    status.GroupId = item.GroupId;
                    status.Latitude = item.Latitude;
                    status.Longitude = item.Longitude;
                    status.Timestamp = item.Timestamp;
                    status.Type = item.Type;
                    status.DestinationId = item.DestinationId;
                    status.Note = item.Note;
                    status.GroupName = item.GroupName;
                    status.Eta = item.Eta;

                    statuses.push(status);
                });
            }

            return statuses;
        });
    }

    public getCalls(): Observable<CallResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/BigBoard/GetCalls';

        return this.http.get<CallResult[]>(url).map((items) => {
            let statuses: CallResult[] = new Array<CallResult>();

            if (items) {
                items.forEach(item => {
                    let status = new CallResult();
                    status.Name = item.Name;
                    status.State = item.State;
                    status.StateCss = item.StateCss;
                    status.Id = item.Id;
                    status.Priority = item.Priority;
                    status.PriorityCss = item.PriorityCss;
                    status.Timestamp = item.Timestamp;
                    status.LoggingUser = item.LoggingUser;
                    status.Color = "#000";
                    status.Address = item.Address;

                    statuses.push(status);
                });
            }

            return statuses;
        });
    }

    public getGroups(): Observable<GroupResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/BigBoard/GetGroups';

        return this.http.get<GroupsModel>(url).map((result) => {
            let groups: GroupResult[] = new Array<GroupResult>();

            if (result && result.Groups) {
                result.Groups.forEach(item => {
                    let group = new GroupResult();
                    group.Gid = item.Gid;
                    group.Typ = item.Typ;
                    group.Nme = item.Nme;
                    group.Add = item.Add;

                    groups.push(group);
                });
            }

            return groups;
        });
    }

    public getLinkedDepartments(): Observable<DepartmentLinkResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/Links/GetActiveDepartmentLinks';

        return this.http.get<DepartmentLinkResult[]>(url).map((result) => {
            let links: DepartmentLinkResult[] = new Array<DepartmentLinkResult>();

            if (result) {
                result.forEach(item => {
                    let link = new DepartmentLinkResult();
                    link.LinkId = item.LinkId;
                    link.DepartmentName = item.DepartmentName;
                    link.Color = item.Color;
                    link.ShareCalls = item.ShareCalls;
                    link.ShareOrders = item.ShareOrders;
                    link.SharePersonnel = item.SharePersonnel;
                    link.ShareUnits = item.ShareUnits;

                    links.push(link);
                });
            }

            return links;
        });
    }

    public getLinkCalls(linkId: number, color: string): Observable<CallResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/Links/GetActiveCallsForLink?linkId=' + linkId;

        return this.http.get<LinkedCallResult[]>(url).map((items) => {
            let statuses: CallResult[] = new Array<CallResult>();

            if (items) {
                items.forEach(item => {
                    let status = new CallResult();
                    status.Name = item.Nme;
                    status.State = item.State;
                    status.StateCss = item.StateCss;
                    status.Id = item.Num;
                    status.Priority = item.Priority;
                    status.PriorityCss = item.PriorityCss;
                    status.Timestamp = item.Lon;
                    //status.LoggingUser = item.Lon;
                    status.Color = color;
                    status.Address = item.Add;

                    statuses.push(status);
                });
            }

            return statuses;
        });
    }

    public getAllLinkedCalls(): Observable<CallResult[]> {
        let url = this.appConfig.ResgridApiUrl + '/Links/GetAllActiveCallsForLinks';

        return this.http.get<LinkedCallResult[]>(url).map((items) => {
            let statuses: CallResult[] = new Array<CallResult>();

            if (items) {
                items.forEach(item => {
                    let status = new CallResult();
                    status.Name = item.Nme;
                    status.State = item.State;
                    status.StateCss = item.StateCss;
                    status.Id = item.Num;
                    status.Priority = item.Priority;
                    status.PriorityCss = item.PriorityCss;
                    status.Timestamp = item.Lon;
                    //status.LoggingUser = item.Lon;
                    status.Color = item.Color;
                    status.Address = item.Add;

                    statuses.push(status);
                });
            }

            return statuses;
        });
    }

    public getAllLinkedCallMarkers(): Observable<MapMakerInfo[]> {
        let url = this.appConfig.ResgridApiUrl + '/Links/GetAllLinkedCallMapMarkers';

        return this.http.get<MapMakerInfo[]>(url).map((items) => {
            let infos: MapMakerInfo[] = new Array<MapMakerInfo>();

            if (items) {
                items.forEach(makerInfo => {
                    let marker = new MapMakerInfo();
                    marker.Longitude = makerInfo.Longitude;
                    marker.Latitude = makerInfo.Latitude;
                    marker.Title = makerInfo.Title;
                    marker.zIndex = makerInfo.zIndex;
                    marker.ImagePath = makerInfo.ImagePath;
                    marker.InfoWindowContent = makerInfo.InfoWindowContent;
                    marker.Color = makerInfo.Color;

                    infos.push(marker);
                });
            }

            return infos;
        });
    }
}