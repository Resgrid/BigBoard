import { type ShiftDaysResultData } from './shiftDayResultData';

export class ShiftResultData {
  public ShiftId: string = '';
  public Name: string = '';
  public Code: string = '';
  public Color: string = '';
  public ScheduleType: number = 0;
  public AssignmentType: number = 0;
  public InShift: boolean = false;
  public PersonnelCount: number = 0;
  public GroupCount: number = 0;
  public NextDay: string = '';
  public NextDayId: string = '';

  public Days: ShiftDaysResultData[] = [];
}
