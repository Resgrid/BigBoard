import { Injectable, Inject } from '@angular/core';
import { MapMakerInfoData, MappingService } from '@resgrid/ngx-resgridlib';
import { GeoLocation } from '../models/geoLocation';
import mapboxgl from 'mapbox-gl';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MapProvider {
  public coordinates = [];

  constructor(private mappingService: MappingService) {}

  public setImages(mapElement: any) {
    if (mapElement) {
      mapElement.loadImage('assets/mapping/Call.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Call-marker', image);
      });

      mapElement.loadImage(
        'assets/mapping/Engine_Available.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Engine_Available-marker', image);
        }
      );

      mapElement.loadImage(
        'assets/mapping/Engine_Responding.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Engine_Responding-marker', image);
        }
      );

      mapElement.loadImage('assets/mapping/Event.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Event-marker', image);
      });

      mapElement.loadImage('assets/mapping/Helipad.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Helipad-marker', image);
      });

      mapElement.loadImage(
        'assets/mapping/Person_Available.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Person_Available-marker', image);
        }
      );

      mapElement.loadImage(
        'assets/mapping/Person_OnScene.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Person_OnScene-marker', image);
        }
      );

      mapElement.loadImage(
        'assets/mapping/Person_RespondingCall.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Person_RespondingCall-marker', image);
        }
      );

      mapElement.loadImage(
        'assets/mapping/Person_RespondingStation.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Person_RespondingStation-marker', image);
        }
      );

      mapElement.loadImage('assets/mapping/Person.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Person-marker', image);
      });

      mapElement.loadImage(
        'assets/mapping/Rescue_Available.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Rescue_Available-marker', image);
        }
      );

      mapElement.loadImage(
        'assets/mapping/Rescue_Responding.png',
        (error, image) => {
          if (error) throw error;
          mapElement.addImage('Rescue_Responding-marker', image);
        }
      );

      mapElement.loadImage('assets/mapping/Station.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Station-marker', image);
      });

      mapElement.loadImage('assets/mapping/WaterSupply.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('WaterSupply-marker', image);
      });

      mapElement.loadImage('assets/mapping/Aircraft.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Aircraft-marker', image);
      });

      mapElement.loadImage('assets/mapping/Ambulance.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Ambulance-marker', image);
      });

      mapElement.loadImage('assets/mapping/Blast.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Blast-marker', image);
      });

      mapElement.loadImage('assets/mapping/Bulldozer.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Bulldozer-marker', image);
      });

      mapElement.loadImage('assets/mapping/Bus.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Bus-marker', image);
      });

      mapElement.loadImage('assets/mapping/Camper.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Camper-marker', image);
      });

      mapElement.loadImage('assets/mapping/Car.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Car-marker', image);
      });

      mapElement.loadImage('assets/mapping/CarAccident.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('CarAccident-marker', image);
      });

      mapElement.loadImage('assets/mapping/CarTwo.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('CarTwo-marker', image);
      });

      mapElement.loadImage('assets/mapping/Check.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Check-marker', image);
      });

      mapElement.loadImage('assets/mapping/CrimeScene.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('CrimeScene-marker', image);
      });

      mapElement.loadImage('assets/mapping/Earthquake.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Earthquake-marker', image);
      });

      mapElement.loadImage('assets/mapping/EmergencyPhone.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('EmergencyPhone-marker', image);
      });

      mapElement.loadImage('assets/mapping/Fire.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Fire-marker', image);
      });

      mapElement.loadImage('assets/mapping/FirstAid.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('FirstAid-marker', image);
      });

      mapElement.loadImage('assets/mapping/Flag.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Flag-marker', image);
      });

      mapElement.loadImage('assets/mapping/Flood.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Flood-marker', image);
      });

      mapElement.loadImage('assets/mapping/FourByFour.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('FourByFour-marker', image);
      });

      mapElement.loadImage('assets/mapping/Gathering.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Gathering-marker', image);
      });

      mapElement.loadImage('assets/mapping/Group.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Group-marker', image);
      });

      mapElement.loadImage('assets/mapping/Helicopter.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Helicopter-marker', image);
      });

      mapElement.loadImage('assets/mapping/Hospital.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Hospital-marker', image);
      });

      mapElement.loadImage('assets/mapping/Industry.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Industry-marker', image);
      });

      mapElement.loadImage('assets/mapping/LineDown.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('LineDown-marker', image);
      });

      mapElement.loadImage('assets/mapping/Motorcycle.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Motorcycle-marker', image);
      });

      mapElement.loadImage('assets/mapping/Pickup.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Pickup-marker', image);
      });

      mapElement.loadImage('assets/mapping/Plowtruck.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Plowtruck-marker', image);
      });

      mapElement.loadImage('assets/mapping/Poison.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Poison-marker', image);
      });

      mapElement.loadImage('assets/mapping/PowerOutage.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('PowerOutage-marker', image);
      });

      mapElement.loadImage('assets/mapping/Radiation.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Radiation-marker', image);
      });

      mapElement.loadImage('assets/mapping/Search.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Search-marker', image);
      });

      mapElement.loadImage('assets/mapping/Shooting.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Shooting-marker', image);
      });

      mapElement.loadImage('assets/mapping/Tires.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Tires-marker', image);
      });

      mapElement.loadImage('assets/mapping/Tools.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Tools-marker', image);
      });

      mapElement.loadImage('assets/mapping/TreeDown.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('TreeDown-marker', image);
      });

      mapElement.loadImage('assets/mapping/Truck.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Truck-marker', image);
      });

      mapElement.loadImage('assets/mapping/Van.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Van-marker', image);
      });

      mapElement.loadImage('assets/mapping/Velocimeter.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Velocimeter-marker', image);
      });

      mapElement.loadImage('assets/mapping/Watercraft.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Watercraft-marker', image);
      });

      mapElement.loadImage('assets/mapping/Workshop.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Workshop-marker', image);
      });

      mapElement.loadImage('assets/mapping/Worksite.png', (error, image) => {
        if (error) throw error;
        mapElement.addImage('Worksite-marker', image);
      });
    }
  }

  public setMarkersForMap(
    mapElement: any,
    position: GeoLocation,
    userMovedMap: boolean
  ): void {
    if (mapElement) {
      this.mappingService.getMapDataAndMarkers().pipe(take(1)).subscribe(
        (data: any) => {
          if (data && data.Data && data.Data.MapMakerInfos) {
            this.coordinates = [];

            const places = {
              type: 'FeatureCollection',
              features: [],
            };

            data.Data.MapMakerInfos.forEach((markerInfo: MapMakerInfoData) => {
              const feature = {
                type: 'Feature',
                properties: {
                  description: `${markerInfo.Title}`,
                  icon: `${markerInfo.ImagePath}-marker`,
                },
                geometry: {
                  type: 'Point',
                  coordinates: [markerInfo.Longitude, markerInfo.Latitude],
                },
              };

              this.coordinates.push(feature.geometry.coordinates);

              places.features.push(feature);
            });

            try {
              let mpLayer = mapElement.getLayer('poi-labels');

              //if (mapElement.isSourceLoaded('places') === true) {
              if (typeof mpLayer != 'undefined') {
                mapElement.removeLayer('poi-labels');
                mapElement.removeSource('places');
              }
            } catch (error) {}

            mapElement.addSource('places', {
              type: 'geojson',
              data: places,
            });

            mapElement.addLayer({
              id: 'poi-labels',
              type: 'symbol',
              source: 'places',
              layout: {
                'text-field': ['get', 'description'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'icon-image': ['get', 'icon'],
              },
            });

            if (!userMovedMap) {
              if (!position) {
                let bounds = this.coordinates.reduce(function (bounds, coord) {
                  return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(
                  this.coordinates[0],
                  this.coordinates[1]
                ));

                mapElement.fitBounds(bounds, {
                  padding: 40,
                });
              } else {
                mapElement.jumpTo({
                  center: new mapboxgl.LngLat(
                    position.Longitude,
                    position.Latitude
                  ),
                  essential: true,
                });
                mapElement.setZoom(13);
              }
            }
          }
        },
        (err: any) => {}
      );
    }
  }
}
