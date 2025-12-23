export class DepartmentVoiceResultData {
  public VoiceEnabled: boolean = false;
  public Realm: string = '';
  public Type: number = 0;
  public VoipServerWebsocketSslAddress: string = '';
  public CallerIdName: string = '';
  public CanConnectApiToken: string = '';
  public Channels: DepartmentVoiceChannelResultData[] = [];
  public UserInfo: DepartmentVoiceUserInfoResultData = new DepartmentVoiceUserInfoResultData();
}

export class DepartmentVoiceChannelResultData {
  public Id: string = '';
  public Name: string = '';
  public ConferenceNumber: number = 0;
  public IsDefault: boolean = false;
  public Token: string = '';
}

export class DepartmentVoiceUserInfoResultData {
  public Username: string = '';
  public Password: string = '';
  public Pin: string = '';
}
