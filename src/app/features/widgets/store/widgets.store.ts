import { PersonnelInfoResultData } from "@resgrid/ngx-resgridlib";
import { GroupSorting } from "src/app/models/groupSorting";
import { PersonnelWidgetSettings } from "src/app/models/personnelWidgetSettings";
import { WeatherWidgetSettings } from "src/app/models/weatherWidgetSettings";


export interface WidgetsState {
    weatherWidgetSettings: WeatherWidgetSettings | null;

    // Personnel Widget
    personnelWidgetSettings: PersonnelWidgetSettings | null;
    personnelWidgetGroupHides: Array<number>;
    personnelWidgetGroupWeights: Array<GroupSorting>;
    personnel: PersonnelInfoResultData[]
}

export const initialState: WidgetsState = {
    weatherWidgetSettings: null,
    personnelWidgetSettings: null,
    personnelWidgetGroupHides: [],
    personnelWidgetGroupWeights: [],
    personnel: [],
};