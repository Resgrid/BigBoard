import { ActiveUnitRoleResultData, CallPriorityResultData, CallResultData, CallTypeResultData, GroupResultData, MapDataAndMarkersData, UnitResultData, UnitRoleResultData, UnitStatusResultData, UnitTypeStatusResultData } from '@resgrid/ngx-resgridlib';
import { GeoLocation } from "src/app/models/geoLocation";
import { PushData } from "src/app/models/pushData";

export interface HomeState {
    lastUpdated: Date;
	connected: boolean;
	status: string;
	statusColor: string;
}

export const initialState: HomeState = {
    lastUpdated: new Date(),
    connected: false,
    status: "Connecting to Resgrid...",
    statusColor: "orange",
};
