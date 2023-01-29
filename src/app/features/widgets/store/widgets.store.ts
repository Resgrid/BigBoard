import { CallResultData, PersonnelInfoResultData, UnitResultData, UnitInfoResultData } from "@resgrid/ngx-resgridlib";
import { CallsWidgetSettings } from "src/app/models/callsWidgetSettings";
import { GroupSorting } from "src/app/models/groupSorting";
import { PersonnelWidgetSettings } from "src/app/models/personnelWidgetSettings";
import { UnitsWidgetSettings } from "src/app/models/unitsWidgetSettings";
import { WeatherWidgetSettings } from "src/app/models/weatherWidgetSettings";


export interface WidgetsState {
    weatherWidgetSettings: WeatherWidgetSettings | null;

    // Personnel Widget
    personnelWidgetSettings: PersonnelWidgetSettings | null;
    personnelWidgetGroupHides: Array<number>;
    personnelWidgetGroupWeights: Array<GroupSorting>;
    personnel: PersonnelInfoResultData[]

    // Calls Widget
    callsWidgetSettings: CallsWidgetSettings | null;
    calls: CallResultData[];

    // Units Widget
    unitsWidgetSettings: UnitsWidgetSettings | null;
    units: UnitInfoResultData[];
}

export const initialState: WidgetsState = {
    weatherWidgetSettings: null,
    personnelWidgetSettings: new PersonnelWidgetSettings(),
    personnelWidgetGroupHides: [],
    personnelWidgetGroupWeights: [],
    personnel: [],
    callsWidgetSettings: new CallsWidgetSettings(),
    calls: [],
    unitsWidgetSettings: new UnitsWidgetSettings(),
    units: [],
};