import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapDataAndMarkersData } from '@resgrid/ngx-resgridlib';
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

@Component({
  selector: 'app-widgets-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<MapWidgetSettings | null>;
  public mapDataState$: Observable<MapDataAndMarkersData | null>;
  public settingsState$: Observable<SettingsState | null>;
  public widgetLayoutState$: Observable<Widget[]>;
  private subs = new SubSink();
  @ViewChild('map') mapContainer;
  public map: any;
  public markers: any[];

  constructor(private store: Store<WidgetsState>) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(selectMapWidgetSettingsState);
    this.mapDataState$ = this.store.select(selectMapWidgetDataState);
    this.widgetLayoutState$ = this.store.select(selectHomeWidgetsState);
    this.settingsState$ = this.store.select(selectSettingsState);
    this.markers = new Array<any>();
  }

  ngOnInit(): void {
    this.subs.sink = this.mapDataState$.subscribe((mapData) => {
      if (mapData) {
        this.processMapData(mapData);
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

  private processMapData(data: MapDataAndMarkersData) {
    this.settingsState$.pipe(take(1)).subscribe((settings) => {
      if (data && settings && settings.appSettings && settings.appSettings.MapUrl) {
        if (!this.map && this.mapContainer && this.mapContainer.nativeElement) {
          this.map = L.map(this.mapContainer.nativeElement, {
            dragging: false,
            doubleClickZoom: false,
            zoomControl: false,
            attributionControl: false,
          });

          L.tileLayer(
            settings?.appSettings.MapUrl,
            {
              crossOrigin: true,
            }
          ).addTo(this.map);

          L.control.attribution({ position: 'bottomleft' }).addTo(this.map);
        }

        if (this.map) {
          this.map.setView([data.CenterLat, data.CenterLon], data.ZoomLevel);

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
                let marker = L.marker(
                  [markerInfo.Latitude, markerInfo.Longitude],
                  {
                    icon: L.icon({
                      iconUrl:
                        'assets/images/mapping/' +
                        markerInfo.ImagePath +
                        '.png',
                      iconSize: [32, 37],
                      iconAnchor: [16, 37],
                    }),
                    draggable: false,
                    title: markerInfo.Title,
                    //tooltip: markerInfo.Title,
                  }
                )
                  .bindTooltip(markerInfo.Title, {
                    permanent: true,
                    direction: 'bottom',
                  })
                  .addTo(this.map);

                this.markers.push(marker);
              });
            }

            var group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds());
          }
        }

        let that = this;
        setTimeout(function () {
          //window.dispatchEvent(new Event('resize'));
          //that.map.invalidateSize.bind(that.map)

          if (that.map) {
            that.map.invalidateSize();
          }
        }, 500);
      }
    });
  }
}
