export class GetSystemConfigResultData {
  public Locations: ResgridSystemLocation[] = [];
}

export class ResgridSystemLocation {
  Name: string = '';
  DisplayName: string = '';
  LocationInfo: string = '';
  IsDefault: boolean = false;
  ApiUrl: string = '';
  AllowsFreeAccounts: boolean = false;
}
