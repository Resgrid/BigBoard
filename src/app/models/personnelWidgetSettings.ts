import { GroupSorting } from './groupSorting';
import { SortModel } from './sortModel';

export class PersonnelWidgetSettings {
  public ShowGroup: boolean = true;
  public ShowStaffing: boolean = true;
  public ShowStatus: boolean = true;
  public ShowRoles: boolean = true;
  public ShowTimestamp: boolean = true;
  public ShowEta: boolean = true;
  public SortRespondingToTop: boolean = false;
  public RespondingText: string = '';
  public HideUnavailable: boolean = false;
  public HideNotResponding: boolean = false;
  public NotRespondingText: string = '';
  public UnavailableText: string = '';
  public FontSize: number = 12;
  public SortOrders: GroupSorting[] = [];
  public HideGroups: string[] = [];
}
