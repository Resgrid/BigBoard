import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ConnectionState,
  Consts,
  EventsService,
  MapDataAndMarkersData,
  MappingService,
  RealtimeGeolocationService,
} from '@resgrid/ngx-resgridlib';
import { Observable, Subscription, take } from 'rxjs';
import { MapWidgetSettings } from 'src/app/models/mapWidgetSettings';
import {
  selectHomeWidgetsState,
  selectMapWidgetDataState,
  selectMapWidgetSettingsState,
  selectSettingsState,
  selectWidgetsState,
} from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import * as L from 'leaflet';
import * as WidgetsActions from '../../actions/widgets.actions';
import { environment } from 'src/environments/environment';
import { Widget } from 'src/app/models/widget';
import { SettingsState } from 'src/app/features/settings/store/settings.store';
import * as _ from 'lodash';

@Component({
  selector: 'app-widgets-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('map') mapContainer;
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<MapWidgetSettings | null>;
  public mapDataState$: Observable<MapDataAndMarkersData | null>;
  public settingsState$: Observable<SettingsState | null>;
  public widgetLayoutState$: Observable<Widget[]>;
  private subs = new SubSink();

  public map: any;
  public layerControl: any;
  public baseMaps: any;
  public markers: any[] = [];
  public layers: any[] = [];
  public showCalls: boolean = true;
  public showStations: boolean = true;
  public showUnits: boolean = true;
  public showPersonnel: boolean = true;
  public hideLabels: boolean = false;
  public filterText: string = '';
  public updateDate: string = '';
  private signalRStarted: boolean = false;

  constructor(
    private store: Store<WidgetsState>,
    private mapProvider: MappingService,
    private realtimeGeolocationService: RealtimeGeolocationService,
    private events: EventsService,
    private consts: Consts
  ) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(selectMapWidgetSettingsState);
    this.mapDataState$ = this.store.select(selectMapWidgetDataState);
    this.widgetLayoutState$ = this.store.select(selectHomeWidgetsState);
    this.settingsState$ = this.store.select(selectSettingsState);
    this.markers = new Array<any>();
  }

  ngOnInit(): void {
    const date = new Date();
    this.updateDate = date.toString();

    this.subs.sink = this.mapDataState$.subscribe((mapData) => {
      if (mapData) {
        this.processMapData(mapData);
        this.startSignalR();
      }
    });

    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      this.store.dispatch(new WidgetsActions.GetMapData());
    });

    this.subs.sink = this.widgetLayoutState$.subscribe((widgets) => {
      if (widgets && widgets.length > 0 && this.map) {
        this.map.invalidateSize();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  private clearLayers() {
    if (this.layers && this.layers.length > 0) {
      this.layers.forEach((layer) => {
        try {
          this.layerControl.removeLayer(layer);
          this.map.removeLayer(layer);
        } catch (error) {}
      });
      this.layers = [];
    } else {
      this.layers = [];
    }
  }

  public colorlayer(feature, layer) {
    layer.on('mouseover', function (e) {
      layer.setStyle({
        fillOpacity: 0.4,
      });
    });
    layer.on('mouseout', function (e) {
      layer.setStyle({
        fillOpacity: 0,
      });
    });
  }

  private getMapLayers() {
    this.mapProvider
      .getMayLayers(0)
      .pipe(take(1))
      .subscribe((data) => {
        if (data && data.Data && data.Data.LayerJson && this.layerControl) {
          this.clearLayers();

          var jsonData = JSON.parse(data.Data.LayerJson);
          if (jsonData) {
            jsonData.forEach((json) => {
              var myLayer = L.geoJSON(json, {
                //onEachFeature: this.colorlayer,
                style: {
                  color: json.features[0].properties.color,
                  opacity: 0.7,
                  fillColor: json.features[0].properties.color,
                  //fillColor: json.features[0].properties.fillColor,
                  fillOpacity: 0.1,
                },
              }); //.addData(json);//.addTo(this.map);
              this.layerControl.addOverlay(
                myLayer,
                json.features[0].properties.name
              );

              this.layers.push(myLayer);
              //myLayer.addData(json);
            });
          }
        }
      });
  }

  private processMapData(data: MapDataAndMarkersData) {
    this.settingsState$.pipe(take(1)).subscribe((settings) => {
      if (data && settings && settings.appSettings && settings.appSettings.MapUrl) {
        if (!this.map && this.mapContainer && this.mapContainer.nativeElement) {
          var osm = L.tileLayer(
            settings?.appSettings.MapUrl,
            {
              crossOrigin: true,
            }
          )
          
          this.baseMaps = {
            OpenStreetMap: osm,
          };

          this.map = L.map(this.mapContainer.nativeElement, {
            dragging: false,
            doubleClickZoom: false,
            zoomControl: false,
            attributionControl: false,
            layers: [osm],
          });

          L.control.attribution({ position: 'bottomleft' }).addTo(this.map);
          this.layerControl = L.control.layers(this.baseMaps).addTo(this.map);
        }

        const date = new Date();
        this.updateDate = date.toString();
        this.clearLayers();

        //this.mapProvider.setMarkersForMap(this.map);

        //this.setMapBounds();

        //if (this.map) {
        this.map.setView([data.CenterLat, data.CenterLon], data.ZoomLevel);
        //}

        // clear map markers
        if (this.markers && this.markers.length >= 0) {
          for (var i = 0; i < this.markers.length; i++) {
            if (this.markers[i]) {
              this.map.removeLayer(this.markers[i]);
            }
          }

          this.markers = new Array<any>();
        }

        if (data.MapMakerInfos && data.MapMakerInfos.length > 0) {
          if (data && data.MapMakerInfos) {
            data.MapMakerInfos.forEach((markerInfo) => {
              if (
                this.filterText === '' ||
                markerInfo.Title.toLowerCase().indexOf(
                  this.filterText.toLowerCase()
                ) >= 0
              ) {
                let markerTitle = '';
                let marker: any = null;
                if (!this.hideLabels) markerTitle = markerInfo.Title;

                if (
                  (markerInfo.Type == 0 && this.showCalls) ||
                  (markerInfo.Type == 1 && this.showUnits) ||
                  (markerInfo.Type == 2 && this.showStations)
                ) {
                  if (!this.hideLabels) {
                    marker = L.marker(
                      [markerInfo.Latitude, markerInfo.Longitude],
                      {
                        icon: L.icon({
                          iconUrl:
                            '/assets/images/mapping/' + markerInfo.ImagePath + '.png',
                          iconSize: [32, 37],
                          iconAnchor: [16, 37],
                        }),
                        draggable: false,
                        title: markerTitle,
                      }
                    )
                      .bindTooltip(markerTitle, {
                        permanent: true,
                        direction: 'bottom',
                      })
                      .addTo(this.map);

                    marker.elementId = markerInfo.Id;
                  } else {
                    marker = L.marker(
                      [markerInfo.Latitude, markerInfo.Longitude],
                      {
                        icon: L.icon({
                          iconUrl:
                            '/assets/images/mapping/' + markerInfo.ImagePath + '.png',
                          iconSize: [32, 37],
                          iconAnchor: [16, 37],
                        }),
                        draggable: false,
                        title: markerTitle,
                      }
                    ).addTo(this.map);

                    marker.elementId = markerInfo.Id;
                  }
                }

                if (marker) {
                  this.markers.push(marker);
                }
              }
            });
          }

          if (this.markers && this.markers.length > 0) {
            var group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds());
          }
        }
      }

      this.getMapLayers();
    });
  }

  public startSignalR() {
    if (!this.signalRStarted) {
      Object.defineProperty(WebSocket, 'OPEN', { value: 1 });
      this.realtimeGeolocationService.connectionState$.subscribe(
        (state: ConnectionState) => {
          if (state === ConnectionState.Disconnected) {
            //this.realtimeGeolocationService.restart(this.departmentId);
          }
        }
      );

      this.signalrInit();
      this.realtimeGeolocationService.start();

      this.signalRStarted = true;
    }
  }

  public stopSignalR() {
    this.realtimeGeolocationService.stop();
    this.signalRStarted = false;
  }

  private signalrInit() {
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.PERSONNEL_LOCATION_UPDATED,
      (data: any) => {
        console.log('person location updated event');
        if (data) {
          let personMarker = _.find(this.markers, [
            'elementId',
            `p${data.userId}`,
          ]);

          if (personMarker) {
            const date = new Date();
            this.updateDate = date.toString();

            personMarker.setLatLng([data.latitude, data.longitude]);
          }
        }
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.UNIT_LOCATION_UPDATED,
      (data: any) => {
        console.log('unit location updated event');
        if (data) {
          let unitMarker = _.find(this.markers, [
            'elementId',
            `u${data.unitId}`,
          ]);

          if (unitMarker) {
            const date = new Date();
            this.updateDate = date.toString();

            unitMarker.setLatLng([data.latitude, data.longitude]);
          }
        }
      }
    );
  }
}
