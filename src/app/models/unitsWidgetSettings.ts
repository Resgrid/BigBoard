import { GroupSorting } from './groupSorting';
import { SortModel } from './sortModel';

export class UnitsWidgetSettings  {
    public ShowStation: boolean = true;
    public ShowType: boolean = true;
    public ShowState: boolean = true;
    public ShowTimestamp: boolean = true;
    public ShowEta: boolean = false;
    public FontSize: number = 12;
    public SortOrders: GroupSorting[];
    public HideGroups: string[];
}