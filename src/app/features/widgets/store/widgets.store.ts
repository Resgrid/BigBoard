import { CallResultData, PersonnelInfoResultData, UnitResultData, UnitInfoResultData, NoteResultData, MapDataAndMarkersData, GpsLocation } from "@resgrid/ngx-resgridlib";
import { CallsWidgetSettings } from "src/app/models/callsWidgetSettings";
import { GroupSorting } from "src/app/models/groupSorting";
import { MapWidgetSettings } from "src/app/models/mapWidgetSettings";
import { NotesWidgetSettings } from "src/app/models/notesWidgetSettings";
import { PersonnelWidgetSettings } from "src/app/models/personnelWidgetSettings";
import { PTTWidgetSettings } from "src/app/models/pttWidgetSettings";
import { UnitsWidgetSettings } from "src/app/models/unitsWidgetSettings";
import { WeatherWidgetSettings } from "src/app/models/weatherWidgetSettings";


export interface WidgetsState {
    // Weather Widget
    weatherWidgetSettings: WeatherWidgetSettings;
    location: GpsLocation | null;

    // Personnel Widget
    personnelWidgetSettings: PersonnelWidgetSettings;
    //personnelWidgetGroupHides: Array<number>;
    //personnelWidgetGroupWeights: Array<GroupSorting>;
    personnel: PersonnelInfoResultData[]

    // Calls Widget
    callsWidgetSettings: CallsWidgetSettings;
    calls: CallResultData[];

    // Units Widget
    unitsWidgetSettings: UnitsWidgetSettings;
    units: UnitInfoResultData[];

    // Notes Widget
    notesWidgetSettings: NotesWidgetSettings;
    notes: NoteResultData[];

    // Map Widget
    mapWidgetSettings: MapWidgetSettings;
    mapData: MapDataAndMarkersData | null;

    // PTT Widget
    pttWidgetSettings: PTTWidgetSettings;
}

export const initialState: WidgetsState = {
    weatherWidgetSettings: new WeatherWidgetSettings(),
    personnelWidgetSettings: new PersonnelWidgetSettings(),
    //personnelWidgetGroupHides: [],
    //personnelWidgetGroupWeights: [],
    personnel: [],
    callsWidgetSettings: new CallsWidgetSettings(),
    calls: [],
    unitsWidgetSettings: new UnitsWidgetSettings(),
    units: [],
    notesWidgetSettings: new NotesWidgetSettings(),
    notes: [],
    mapWidgetSettings: new MapWidgetSettings(),
    mapData: null,
    location: null,
    pttWidgetSettings: new PTTWidgetSettings(),
};