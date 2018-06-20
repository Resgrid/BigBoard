import { Component, ElementRef, ViewChild, Inject } from '@angular/core';

import { MapResult } from '../../models/mapResult';
import { MapWidgetSettings } from '../../models/mapWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { APP_CONFIG_TOKEN, AppConfig } from "../../config/app.config-interface";
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings';

declare var google;
declare var MarkerWithLabel;

@Component({
    selector: 'map-widget',
    templateUrl: 'map-widget.html'
})
export class MapWidget {
    @ViewChild('map') mapElement: ElementRef;
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

            this.fetch();
        });

        this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
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
            }
        });

        this.setMapBounds();

        this.fetch();
    }

    private initMap() {
        if (typeof google == "undefined" || typeof google.maps == "undefined") {
            let script = document.createElement("script");
            script.id = "googleMaps";
            this.apiKey = this.appConfig.GoogleMapKey;

            if (this.apiKey && this.apiKey !== '' && this.apiKey !== 'GOOGLEAPIHIDDEN') {
                script.src = 'https://maps.google.com/maps/api/js?key=' + this.apiKey;
            } else {
                script.src = 'https://maps.google.com/maps/api/js';
            }
            //document.body.appendChild(script);

            let marketWithLabelScript = document.createElement("script");
            marketWithLabelScript.id = "marketWithLabelScript";
            marketWithLabelScript.src = 'assets/markerWithLabel/markerwithlabel.js';
            //document.body.appendChild(marketWithLabelScript);
        }
    }

    private fetch() {
        this.dataProvider.getMap().subscribe(
            data => {
                this.mapData = data;

                var mapCenter = this.getMapCenter(data);
                var mapOptions = {
                    zoom: this.getMapZoomLevel(data),
                    center: mapCenter,
                    mapTypeId: this.getMapType()
                };

                this.setMapBounds();

                this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

                // clear map markers
                if (this.markers && this.markers.length >= 0) {
                    // remove current markers.
                    for (var i = 0; i < this.markers.length; i++) {
                        this.markers[i].setMap(null);
                    }

                    this.markers = new Array<any>();
                }

                if (data.MapMakerInfos && data.MapMakerInfos.length > 0) {
                    for (var t = 0; t < data.MapMakerInfos.length; t++) {
                        let marker = data.MapMakerInfos[t];



                        var latLng = new google.maps.LatLng(marker.Latitude, marker.Longitude);

                        var mapMarker = new MarkerWithLabel({
                            position: latLng,
                            draggable: false,
                            raiseOnDrag: false,
                            map: this.map,
                            title: marker.Title,
                            icon: "/assets/mapping/" + marker.ImagePath + ".png",
                            labelContent: marker.Title,
                            labelAnchor: new google.maps.Point(35, 0),
                            labelClass: "labels",
                            labelStyle: { opacity: 0.60 }
                        });

                        if (this.markerTypeEnabled(marker))
                            this.markers.push(mapMarker);
                    }

                    if (this.settings.ShowAllMarkers) {
                        var latlngbounds = new google.maps.LatLngBounds();
                        for (var y = 0; y < data.MapMakerInfos.length; y++) {
                            let latLng2 = new google.maps.LatLng(data.MapMakerInfos[y].Latitude, data.MapMakerInfos[y].Longitude);
                            latlngbounds.extend(latLng2);
                        }

                        this.map.setCenter(latlngbounds.getCenter());
                        this.map.fitBounds(latlngbounds);
                        var zoom = this.map.getZoom();
                        this.map.setZoom(zoom > this.getMapZoomLevel(data) ? this.getMapZoomLevel(data) : zoom);
                    } /*else if ($scope.widgetSettings.centerLat > 0 && $scope.widgetSettings.centerLon > 0) {
                        var mapCenter = new google.maps.LatLng($scope.widgetSettings.centerLat, $scope.widgetSettings.centerLon);
                        map.setCenter(mapCenter);
                        map.setZoom($scope.widgetSettings.zoom);
                    }*/
                }

                if (this.settings.ShowLinkedCalls) {
                    this.dataProvider.getAllLinkedCallMarkers().subscribe(data => {
                        for (var t = 0; t < data.length; t++) {
                            let marker = data[t];

                            var latLng = new google.maps.LatLng(marker.Latitude, marker.Longitude);

                            var mapMarker = new google.maps.Marker({
                                position: latLng,
                                map: this.map,
                                draggable: false,
                                title: marker.Title,
                                icon: this.pinSymbol(marker.Color)
                            });

                            /*
                                                        var mapMarker = new MarkerWithLabel({
                                                            position: latLng,
                                                            draggable: false,
                                                            raiseOnDrag: false,
                                                            map: this.map,
                                                            title: marker.Title,
                                                            icon: "/assets/mapping/" + marker.ImagePath + ".png",
                                                            labelContent: marker.Title,
                                                            labelAnchor: new google.maps.Point(35, 0),
                                                            labelClass: "labels",
                                                            labelStyle: { color: marker.Color, opacity: 0.60 }
                                                        });
                            */
                            if (this.markerTypeEnabled(marker))
                                this.markers.push(mapMarker);
                        }
                    });
                }
            });
    }

    private pinSymbol(color: string): any {
        return {
            path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#000',
            strokeWeight: 1,
            scale: 1,
            labelOrigin: new google.maps.Point(0, -29)
        };
    }

    private setMapBounds() {
        let parent = this.mapElement.nativeElement.parentElement.parentElement.parentElement;
        this.mapWidth = parent.offsetWidth - 35 + "px";
        this.mapHeight = parent.offsetHeight - 60 + "px";
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
                    return google.maps.MapTypeId.ROADMAP;
                case "Satellite":
                    return google.maps.MapTypeId.SATELLITE;
                case "Hybrid":
                    return google.maps.MapTypeId.HYBRID;
                case "Terrain":
                    return google.maps.MapTypeId.TERRAIN;
                default:
                    return google.maps.MapTypeId.ROADMAP;
            }
        }
    }

    private getMapCenter(data: MapResult) {
        if (this.settings && this.settings.Latitude && this.settings.Longitude) {
            if (this.settings.Latitude != 0 && this.settings.Longitude != 0) {
                return new google.maps.LatLng(this.settings.Latitude, this.settings.Longitude);
            }
        }

        return new google.maps.LatLng(data.CenterLat, data.CenterLon);
    }

    private getMapZoomLevel(data: MapResult): any {
        if (this.settings && this.settings.ZoomLevel > 0) {
            return this.settings.ZoomLevel;
        } else {
            return data.ZoomLevel;
        }
    }
}