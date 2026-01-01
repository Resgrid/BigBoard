export class ShiftDaysResultData {
  public ShiftId: string = '';
  public ShiftName: string = '';
  public ShiftDayId: string = '';
  public ShiftDay: string = '';
  public Start: string = '';
  public End: string = '';
  public SignedUp: boolean = false;
  public ShiftType: number = 0;

  public Signups: ShiftDaySignupResultData[] = [];
  public Needs: ShiftDayGroupNeedsResultData[] = [];
}

export class ShiftDaySignupResultData {
  public UserId: string = '';
  public Name: string = '';
  public Roles: number[] = [];
}

export class ShiftDayGroupNeedsResultData {
  public GroupId: string = '';
  public GroupName: string = '';
  public GroupNeeds: ShiftDayGroupRoleNeedsResultData[] = [];
}

export class ShiftDayGroupRoleNeedsResultData {
  public RoleId: string = '';
  public RoleName: string = '';
  public Needed: number = 0;
}
