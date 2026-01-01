export class SavePersonsStatusesInput {
  public UserIds: string[] = [];
  public Type: string = '';
  public RespondingTo: string = '';
  public TimestampUtc: string = '';
  public Timestamp: string = '';
  public Note: string = '';
  public Latitude: string = '';
  public Longitude: string = '';
  public Accuracy: string = '';
  public Altitude: string = '';
  public AltitudeAccuracy: string = '';
  public Speed: string = '';
  public Heading: string = '';
  public EventId: string = '';
}
