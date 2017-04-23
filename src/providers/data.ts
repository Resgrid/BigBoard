import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import {Observable} from "rxjs/Observable";

import { Consts } from '../app/consts';
import { UtilsProvider } from './utils';

import { PersonnelStatusResult } from '../models/personnelStatusResult';
import { MapResult } from '../models/mapResult';
import { MapMakerInfo } from '../models/mapMakerInfo';
import { WeatherResult } from '../models/weatherResult';
import { UnitStatusResult } from '../models/unitStatusResult';
import { CallResult } from '../models/callResult';
import { GroupResult } from '../models/groupResult';
import { DepartmentLinkResult } from '../models/departmentLinkResult';

@Injectable()
export class DataProvider {
    constructor(public http: Http, private consts: Consts, private utils: UtilsProvider) {

    }

    public getPersonnelStatuses(): Observable<PersonnelStatusResult[]> {
        let url = this.consts.ResgridApiUrl + '/BigBoard/GetPersonnelStatuses';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((items) => {
            let statuses: PersonnelStatusResult[] = new Array<PersonnelStatusResult>();

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

            return statuses;
        });
    }

    public getMap(): Observable<MapResult> {
        let url = this.consts.ResgridApiUrl + '/BigBoard/GetMap';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((item) => {
            let mapResult: MapResult = new MapResult();
            mapResult.MapMakerInfos = new Array<MapMakerInfo>();

            mapResult.CenterLat = item.CenterLat;
            mapResult.CenterLon = item.CenterLon;
            mapResult.ZoomLevel = item.ZoomLevel;


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

            return mapResult;
        });
    }

    public getWeather(): Observable<WeatherResult> {
        let url = this.consts.ResgridApiUrl + '/BigBoard/GetWeather';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((item) => {
            let weatherResult: WeatherResult = new WeatherResult();

            weatherResult.WeatherUnit = item.WeatherUnit; 
            weatherResult.Longitude = item.Longitude;
            weatherResult.Latitude = item.Latitude;

            return weatherResult;
        });
    }

    public getUnitStatuses(): Observable<UnitStatusResult[]> {
        let url = this.consts.ResgridApiUrl + '/BigBoard/GetUnitStatuses';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((items) => {
            let statuses: UnitStatusResult[] = new Array<UnitStatusResult>();

            items.forEach(item => {
                let status = new UnitStatusResult();
                status.Name = item.Name;
                status.State = item.State;
                status.StateCss = item.StateCss;
                status.GroupId = item.GroupId;
                status.StateStyle = item.StateStyle;
                status.Latitude = item.Latitude;
                status.Longitude = item.Longitude;
                status.Timestamp = item.Timestamp;
                status.Type = item.Type;
                status.DestinationId = item.DestinationId;
                status.Note = item.Note;
                status.GroupName = item.GroupName;

                statuses.push(status);
            });

            return statuses;
        });
    }

    public getCalls(): Observable<CallResult[]> {
        let url = this.consts.ResgridApiUrl + '/BigBoard/GetCalls';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((items) => {
            let statuses: CallResult[] = new Array<CallResult>();

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

                statuses.push(status);
            });

            return statuses;
        });
    }

    public getGroups(): Observable<GroupResult[]> {
        let url = this.consts.ResgridApiUrl + '/BigBoard/GetGroups';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((result) => {
            let groups: GroupResult[] = new Array<GroupResult>();

            result.Groups.forEach(item => {
                let group = new GroupResult();
                group.Gid = item.Gid;
                group.Typ = item.Typ;
                group.Nme = item.Nme;
                group.Add = item.Add;

                groups.push(group);
            });

            return groups;
        });
    }

    public getLinkedDepartments(): Observable<DepartmentLinkResult[]> {
        let url = this.consts.ResgridApiUrl + '/Links/GetActiveDepartmentLinks';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((result) => {
            let links: DepartmentLinkResult[] = new Array<DepartmentLinkResult>();

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

            return links;
        });
    }

    public getLinkCalls(linkId: number, color: string): Observable<CallResult[]> {
        let url = this.consts.ResgridApiUrl + '/Links/GetActiveCallsForLink&linkId=' + linkId;

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((items) => {
            let statuses: CallResult[] = new Array<CallResult>();

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
                status.Color = color;

                statuses.push(status);
            });

            return statuses;
        });
    }

    public getAllLinkedCallMarkers(): Observable<MapMakerInfo[]> {
        let url = this.consts.ResgridApiUrl + '/Links/GetAllLinkedCallMapMarkers';

        return this.http.get(url, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json()).map((items) => {
            let infos: MapMakerInfo[] = new Array<MapMakerInfo>();

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

            return infos;
        });
    }
}