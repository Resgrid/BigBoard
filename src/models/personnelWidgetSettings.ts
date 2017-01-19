import { SortModel } from './sortModel';

export class PersonnelWidgetSettings  {
    public ShowGroup: boolean = true;
    public ShowStaffing: boolean = true;
    public ShowStatus: boolean = true;
    public ShowRoles: boolean = true;
    public ShowTimestamp: boolean = true;
    public ShowEta: boolean = true;
    public SortRespondingToTop: boolean = true;
    public HideUnavailable: boolean = true;
    public HideNotResponding: boolean = true;
    public NotRespondingText: string = "";
    public UnavailableText: string = "";
    public FontSize: number = 12;
    public SortOrders: SortModel[];
    public HideGroups: number[];
}