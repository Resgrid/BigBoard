export class CallProtocolsResultData {
  public Id: string = '';
  public DepartmentId: string = '';
  public Name: string = '';
  public Code: string = '';
  public Description: string = '';
  public ProtocolText: string = '';
  public CreatedOn: string = '';
  public CreatedByUserId: string = '';
  public IsDisabled: boolean = false;
  public UpdatedOn: string = '';
  public UpdatedByUserId: string = '';
  public MinimumWeight: number = 0;
  public State: number = 0;
  public Triggers: ProtocolTriggerResultData[] = [];
  public Attachments: ProtocolTriggerAttachmentResultData[] = [];
  public Questions: ProtocolTriggerQuestionResultData[] = [];
}

export class ProtocolTriggerResultData {
  public Id: string = '';
  public Type: number = 0;
  public StartsOn: string = '';
  public EndsOn: string = '';
  public Priority: number = 0;
  public CallType: string = '';
  public Geofence: string = '';
}

export class ProtocolTriggerAttachmentResultData {
  public Id: string = '';
  public FileName: string = '';
  public FileType: string = '';
}

export class ProtocolTriggerQuestionResultData {
  public Id: string = '';
  public Question: string = '';
  public Answers: ProtocolQuestionAnswerResultData[] = [];
}

export class ProtocolQuestionAnswerResultData {
  public Id: string = '';
  public Answer: string = '';
  public Weight: number = 0;
}
