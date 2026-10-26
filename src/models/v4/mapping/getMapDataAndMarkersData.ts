export class MapDataAndMarkersData {
  public CenterLat: string = '';
  public CenterLon: string = '';
  public ZoomLevel: string = '';
  public MapMakerInfos: MapMakerInfoData[] = [];
}

export class MapMakerInfoData {
  public Id: string = '';
  public Longitude: number = 0;
  public Latitude: number = 0;
  public Title: string = '';
  public zIndex: string = '';
  public ImagePath: string = '';
  public InfoWindowContent: string = '';
  public Color: string = '';
  public Type: number = 0;
  /**
   * The department's uploaded icon for the pin (absolute URL): the unit type for unit pins (Type 1), the call type for
   * call pins (Type 0), the POI type for POI pins (Type 4), and for personnel pins (Type 3) the icon of the first role the
   * person holds, in the department's role order, that has one. For call, unit and personnel pins it is the upload made
   * for the current priority/status when there is one, otherwise the type's/role's own upload with a status-badge style
   * query appended, so it changes when the status does. Wins over every other icon when present; null otherwise or from
   * older servers.
   */
  public IconUrl?: string | null = null;
  /**
   * The built-in pin recoloured to the call's priority or the unit's/person's status (absolute URL, same 32 x 37 shape and
   * bottom-tip anchor as the bundled pins). Drawn in place of the bundled `ImagePath` pin, untinted, when there is no
   * upload. Null when the priority/status has no meaning, always null for stations, POIs and hydrants, and absent from
   * older servers.
   */
  public PinIconUrl?: string | null = null;
  /**
   * The style key `PinIconUrl` was drawn in: a status (`available`, `dispatched`, `responding`, `onscene`, `transporting`,
   * `returning`, `staging`, `delayed`, `unavailable`) or a priority (`low`, `medium`, `high`, `emergency`). Null as for
   * `PinIconUrl`.
   */
  public IconStyle?: string | null = null;
}
