export class MessageResultData {
  public MessageId: string = '';
  public Subject: string = '';
  public SendingName: string = '';
  public SendingUserId: string = '';
  public Body: string = '';
  public SentOn: string = '';
  public SentOnUtc: string = '';
  public Type: number = 0;
  public ExpiredOn: string = '';
  public Responded: boolean = false;
  public Note: string = '';
  public RespondedOn: string = '';
  public ResponseType: string = '';
  public IsSystem: boolean = false;

  public Recipients: MessageRecipientResultData[] = [];
}

export class MessageRecipientResultData {
  public MessageId: string = '';
  public UserId: string = '';
  public Name: string = '';
  public RespondedOn: string = '';
  public Response: string = '';
  public Note: string = '';
}
