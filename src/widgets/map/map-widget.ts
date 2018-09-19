import { Component, ElementRef, ViewChild, Inject } from '@angular/core';

import { MapResult } from '../../models/mapResult';
import { MapWidgetSettings } from '../../models/mapWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { APP_CONFIG_TOKEN, AppConfig } from "../../config/app.config-interface";
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings';

import leaflet from 'leaflet';
import L from 'leaflet';
import { MapProvider } from '../../providers/map';

@Component({
    selector: 'map-widget',
    templateUrl: 'map-widget.html'
})
export class MapWidget {
    @ViewChild('map') mapContainer;

    public mapData: MapResult;
    public markers: any[];
    public settings: MapWidgetSettings;
    private settingsUpdatedSubscription: any;
    public map: any;
    private apiKey: any;
    public mapWidth: string = "100px";
    public mapHeight: string = "100px";

    constructor(private dataProvider: DataProvider,
        private widgetPubSub: WidgetPubSub,
        @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig,
        private settingsProvider: SettingsProvider) {
        this.settings = new MapWidgetSettings();
        this.markers = new Array<any>();
    }

    ngOnInit() {
        this.settingsProvider.loadMapWidgetSettings().then((settings) => {
            if (settings) {
                this.settings = settings;
            }

            //setTimeout(function () { this.fetch(); }, 1000);
        });

        this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
            this.setMapBounds();

            if (e.event === this.widgetPubSub.EVENTS.MAP_SETTINGS) {
                this.settings = e.data;
                this.fetch();
            } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_STATUS_UPDATED) {
                this.fetch();
            } else if (e.event === this.widgetPubSub.EVENTS.PERSONNEL_STAFFING_UPDATED) {
                this.fetch();
            } else if (e.event === this.widgetPubSub.EVENTS.CALLS_SETTINGS) {
                this.fetch();
            } else if (e.event === this.widgetPubSub.EVENTS.UNIT_STATUS_UPDATED) {
                this.fetch();
            } else if (e.event === this.widgetPubSub.EVENTS.MAP_WIDGET_RESIZED) {
                this.setMapBounds();
            }
        });

        this.fetch();
    }

    private updateMapSize() {
        if (this.map) {
            let that = this;
            setTimeout(function () {
                //window.dispatchEvent(new Event('resize'));
                //that.map.invalidateSize.bind(that.map)
                that.map.invalidateSize();
            }, 300);
        }
    }

    private initMap() {
        //this.setMapBounds();

        /*
        if (!this.map) {
            this.map = leaflet.map(this.mapContainer.nativeElement, {
                dragging: false,
                doubleClickZoom: false,
                zoomControl: false
            });

            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
            }).addTo(this.map);

            //this.updateMapSize();
        }
        */
    }

    private fetch() {
        this.setMapBounds();

        this.dataProvider.getMap().subscribe(
            data => {
                this.mapData = data;

                var mapCenter = this.getMapCenter(data);

                if (!this.map) {
                    this.map = leaflet.map(this.mapContainer.nativeElement, {
                        dragging: false,
                        doubleClickZoom: false,
                        zoomControl: false
                    });

                    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
                    }).addTo(this.map);
                }

                //this.mapProvider.setMarkersForMap(this.map);

                this.setMapBounds();

                //if (this.map) {
                this.map.setView(mapCenter, this.getMapZoomLevel(data));
                //}

                // clear map markers
                if (this.markers && this.markers.length >= 0) {
                    // remove current markers.
                    for (var i = 0; i < this.markers.length; i++) {
                        //this.markers[i].setMap(null);
                    }

                    this.markers = new Array<any>();
                }

                if (data.MapMakerInfos && data.MapMakerInfos.length > 0) {
                    if (data && data.MapMakerInfos) {
                        data.MapMakerInfos.forEach(markerInfo => {

                            if (this.markerTypeEnabled(markerInfo)) {
                                let marker = leaflet.marker([markerInfo.Latitude, markerInfo.Longitude], {
                                    icon: new leaflet.icon({
                                        iconUrl: "assets/mapping/" + markerInfo.ImagePath + ".png",
                                        iconSize: [32, 37],
                                        iconAnchor: [16, 37]
                                    }),
                                    draggable: false,
                                    title: markerInfo.Title,
                                    tooltip: markerInfo.Title
                                }).bindTooltip(markerInfo.Title,
                                    {
                                        permanent: true,
                                        direction: 'bottom'
                                    }).addTo(this.map);

                                this.markers.push(marker);
                            }
                        });
                    }


                    if (this.settings.ShowAllMarkers) {
                        var group = new leaflet.featureGroup(this.markers);

                        this.map.fitBounds(group.getBounds());
                    }

                }

                if (this.settings.ShowLinkedCalls) {
                    this.dataProvider.getAllLinkedCallMarkers().subscribe(data => {
                        for (var t = 0; t < data.length; t++) {
                            let markerInfo = data[t];

                            let options = {
                                iconShape: 'circle-dot',
                                borderWidth: 5,
                                borderColor: '#00ABDC'
                            };
                            //https://github.com/marslan390/BeautifyMarker

                            let marker = leaflet.marker([markerInfo.Latitude, markerInfo.Longitude], {
                                icon: leaflet.BeautifyIcon.icon(options),
                                draggable: false
                            }).bindTooltip(markerInfo.Title,
                                {
                                    permanent: true,
                                    direction: 'bottom'
                                }).addTo(this.map);

                            this.markers.push(marker);
                        }
                    });
                }
            });
    }

    private setMapBounds() {
        let parent = this.mapContainer.nativeElement.parentElement.parentElement.parentElement;
        this.mapWidth = parent.offsetWidth - 35 + "px";
        this.mapHeight = parent.offsetHeight - 60 + "px";

        this.updateMapSize();
    }

    private markerTypeEnabled(marker: any): boolean {
        switch (marker.ImagePath) {
            case "Call":
                if (this.settings.ShowCalls)
                    return true;
            case "Station":
                if (this.settings.ShowStations)
                    return true;
            case "Person_RespondingCall":
                if (this.settings.ShowPersonnel)
                    return true;
            case "Person_RespondingStation":
                if (this.settings.ShowPersonnel)
                    return true;
            case "Person_OnScene":
                if (this.settings.ShowPersonnel)
                    return true;
            case "Engine_Responding":
                if (this.settings.ShowUnits)
                    return true;
        }

        return false;
    }

    private getMapType() {
        if (this.settings) {
            switch (this.settings.Style) {
                case "Roadmap":
                //return google.maps.MapTypeId.ROADMAP;
                case "Satellite":
                //return google.maps.MapTypeId.SATELLITE;
                case "Hybrid":
                //return google.maps.MapTypeId.HYBRID;
                case "Terrain":
                //return google.maps.MapTypeId.TERRAIN;
                default:
                //return google.maps.MapTypeId.ROADMAP;
            }
        }
    }

    private getMapCenter(data: MapResult) {
        if (this.settings && this.settings.Latitude && this.settings.Longitude) {
            if (this.settings.Latitude != 0 && this.settings.Longitude != 0) {
                return [this.settings.Latitude, this.settings.Longitude];
            }
        }

        return [data.CenterLat, data.CenterLon];
    }

    private getMapZoomLevel(data: MapResult): any {
        if (this.settings && this.settings.ZoomLevel > 0) {
            return this.settings.ZoomLevel;
        } else {
            return data.ZoomLevel;
        }
    }
}