import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapDataAndMarkersData } from '@resgrid/ngx-resgridlib';
import { Observable, Subscription } from 'rxjs';
import { MapWidgetSettings } from 'src/app/models/mapWidgetSettings';
import {
  selectHomeWidgetsState,
  selectMapWidgetDataState,
  selectMapWidgetSettingsState,
  selectWidgetsState,
} from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import * as L from 'leaflet';
import * as WidgetsActions from '../../actions/widgets.actions';
import { environment } from 'src/environments/environment';
import { Widget } from 'src/app/models/widget';

@Component({
  selector: 'app-widgets-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<MapWidgetSettings | null>;
  public mapDataState$: Observable<MapDataAndMarkersData | null>;
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
    if (data) {
      if (!this.map) {
        this.map = L.map(this.mapContainer.nativeElement, {
          dragging: false,
          doubleClickZoom: false,
          zoomControl: false,
        });

        L.tileLayer(
          'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=' +
            environment.mapTilerKey,
          {
            crossOrigin: true,
          }
        ).addTo(this.map);
      }

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
            let marker = L.marker([markerInfo.Latitude, markerInfo.Longitude], {
              icon: L.icon({
                iconUrl:
                  'assets/images/mapping/' + markerInfo.ImagePath + '.png',
                iconSize: [32, 37],
                iconAnchor: [16, 37],
              }),
              draggable: false,
              title: markerInfo.Title,
              //tooltip: markerInfo.Title,
            })
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

      let that = this;
      setTimeout(function () {
        //window.dispatchEvent(new Event('resize'));
        //that.map.invalidateSize.bind(that.map)
        that.map.invalidateSize();
      }, 500);
    }
  }
}
