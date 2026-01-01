export class SetUnitRolesInput {
  public UnitId: string = '';
  public Roles: SetUnitRolesRoleInput[] = [];
}

export class SetUnitRolesRoleInput {
  public UserId: string = '';
  public RoleId: string = '';
  public Name: string = '';
}
