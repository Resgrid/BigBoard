import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from "rxjs/Observable";
import { APP_CONFIG_TOKEN, AppConfig } from "../config/app.config-interface";

import { CallApiResult } from '../models/callApiResult';
import { CallDataResult } from '../models/callDataResult';
import { CallFileResult } from '../models/callFileResult';

@Injectable()
export class CallsProvider {

	constructor(public http: HttpClient, @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig) {

	}

	public getCall(callId: any): Observable<CallApiResult> {
		let url = this.appConfig.ResgridApiUrl + '/Calls/GetCall';

		let params = new HttpParams().append('callId', callId);

		return this.http.get<CallApiResult>(url, { params: params }).map((item) => {
			let status: CallApiResult = this.mapDataToCall(item);

			return status;
		});
	}

	public getCallData(callId: any): Observable<CallDataResult> {
		let url = this.appConfig.ResgridApiUrl + '/Calls/GetCallExtraData';

		let params = new HttpParams().append('callId', callId);

		return this.http.get(url, { params: params }).map((item) => {
			let status: CallDataResult = <CallDataResult>item;

			status.Activity.forEach(activity => {
				if (activity.Type === "User") {
					//activity.StatusText = this.typesProvider.statusToTextConverter(activity.StatusId);
					//activity.StatusColor = this.typesProvider.statusToColorConverter(activity.StatusId);
				} else {
					//activity.StatusText = this.typesProvider.unitStatusToTextConverter(activity.StatusId);
					//activity.StatusColor = this.typesProvider.unitStatusToColorConverter(activity.StatusId);
				}
			});


			return status;
		});
	}


	public getCallAudio(callId: number, includeData: boolean): Observable<CallFileResult[]> {
		return this.getFiles(callId, includeData, 1);
	}

	public getFiles(callId: number, includeData: boolean, type: number): Observable<CallFileResult[]> {
		let params = new HttpParams().append('callId', callId.toString()).append('includeData', includeData.toString()).append('type', type.toString());

		return this.http.get<CallFileResult[]>(this.appConfig.ResgridApiUrl + '/Calls/GetFilesForCall', { params: params })
			.map((items) => {
				let files: CallFileResult[] = new Array<CallFileResult>();

				items.forEach(item => {
					let file = <CallFileResult>item;
					files.push(file);
				});

				return files;
			});
	}

	private mapDataToCall(item: any): CallApiResult {
		let status: CallApiResult = new CallApiResult();

		status.Cid = item.Cid;
		status.Pri = item.Pri;
		status.Ctl = item.Ctl;
		status.Nme = item.Nme;

		status.Noc = item.Noc;
		status.Map = item.Map;
		status.Not = item.Not;
		status.Add = item.Add;

		status.Geo = item.Geo;
		status.Lon = item.Lon;
		status.Utc = item.Utc;
		status.Ste = item.Ste;
		status.Num = item.Num;

		status.Nts = item.Nts;
		status.Aud = item.Aud;
		status.Img = item.Img;
		status.Fls = item.Fls;
		status.w3w = item.w3w;
		status.Aid = item.Aid;

		//status.PriorityColor = this.typesProvider.priorityToColorConverter(status.Pri);
		//status.PriorityText = this.typesProvider.priorityToTextConverter(status.Pri);

		return status;
	}
}
