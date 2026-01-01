import { type FeatureCollection } from 'geojson';

export class GetMapLayersResultData {
  public LayerJson: string = '';
  public Layers: GetMapLayersData[] = [];
}

export class GetMapLayersData {
  public Id: string = '';
  public DepartmentId: string = '';
  public Name: string = '';
  public Type: number = 0;
  public Color: string = '';
  public IsSearchable: boolean = false;
  public IsOnByDefault: boolean = false;
  public AddedById: string = '';
  public AddedOn: string = '';
  public UpdatedById: string = '';
  public UpdatedOn: string = '';
  public Data: GetMapLayersDataInfo = new GetMapLayersDataInfo();
}

export class GetMapLayersDataInfo {
  public Type: string = '';
  public Features: FeatureCollection[] = [];
}
