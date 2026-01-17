// Mock for @rnmapbox/maps
// This module requires native code that's not available in Jest tests

import React from 'react';

const MockMapView = React.forwardRef(({ children, ...props }: any, ref: any) => {
  return React.createElement('MapView', { ...props, ref }, children);
});
MockMapView.displayName = 'MockMapView';

const MockCamera = React.forwardRef((props: any, ref: any) => {
  return React.createElement('Camera', { ...props, ref });
});
MockCamera.displayName = 'MockCamera';

const MockMarkerView = ({ children, ...props }: any) => {
  return React.createElement('MarkerView', props, children);
};

const MockPointAnnotation = React.forwardRef(({ children, ...props }: any, ref: any) => {
  return React.createElement('PointAnnotation', { ...props, ref }, children);
});
MockPointAnnotation.displayName = 'MockPointAnnotation';

const MockCallout = ({ children, ...props }: any) => {
  return React.createElement('Callout', props, children);
};

const MockShapeSource = ({ children, ...props }: any) => {
  return React.createElement('ShapeSource', props, children);
};

const MockLineLayer = (props: any) => {
  return React.createElement('LineLayer', props);
};

const MockSymbolLayer = (props: any) => {
  return React.createElement('SymbolLayer', props);
};

const MockCircleLayer = (props: any) => {
  return React.createElement('CircleLayer', props);
};

const MockFillLayer = (props: any) => {
  return React.createElement('FillLayer', props);
};

const MockImages = ({ children, ...props }: any) => {
  return React.createElement('Images', props, children);
};

const MockUserLocation = (props: any) => {
  return React.createElement('UserLocation', props);
};

const MockLocationPuck = (props: any) => {
  return React.createElement('LocationPuck', props);
};

const MockRasterSource = ({ children, ...props }: any) => {
  return React.createElement('RasterSource', props, children);
};

const MockRasterLayer = (props: any) => {
  return React.createElement('RasterLayer', props);
};

const MockVectorSource = ({ children, ...props }: any) => {
  return React.createElement('VectorSource', props, children);
};

const MockBackgroundLayer = (props: any) => {
  return React.createElement('BackgroundLayer', props);
};

const MockAtmosphere = (props: any) => {
  return React.createElement('Atmosphere', props);
};

const MockTerrain = (props: any) => {
  return React.createElement('Terrain', props);
};

const MockSkyLayer = (props: any) => {
  return React.createElement('SkyLayer', props);
};

const MockHeatmapLayer = (props: any) => {
  return React.createElement('HeatmapLayer', props);
};

const MockFillExtrusionLayer = (props: any) => {
  return React.createElement('FillExtrusionLayer', props);
};

export const MapView = MockMapView;
export const Camera = MockCamera;
export const MarkerView = MockMarkerView;
export const PointAnnotation = MockPointAnnotation;
export const Callout = MockCallout;
export const ShapeSource = MockShapeSource;
export const LineLayer = MockLineLayer;
export const SymbolLayer = MockSymbolLayer;
export const CircleLayer = MockCircleLayer;
export const FillLayer = MockFillLayer;
export const Images = MockImages;
export const UserLocation = MockUserLocation;
export const LocationPuck = MockLocationPuck;
export const RasterSource = MockRasterSource;
export const RasterLayer = MockRasterLayer;
export const VectorSource = MockVectorSource;
export const BackgroundLayer = MockBackgroundLayer;
export const Atmosphere = MockAtmosphere;
export const Terrain = MockTerrain;
export const SkyLayer = MockSkyLayer;
export const HeatmapLayer = MockHeatmapLayer;
export const FillExtrusionLayer = MockFillExtrusionLayer;

// Static methods
export const setAccessToken = jest.fn();
export const getAccessToken = jest.fn().mockResolvedValue('test-token');
export const setTelemetryEnabled = jest.fn();
export const requestAndroidLocationPermissions = jest.fn().mockResolvedValue(true);
export const setConnected = jest.fn();

// Mapbox namespace for style URLs
export const StyleURL = {
  Street: 'mapbox://styles/mapbox/streets-v11',
  Dark: 'mapbox://styles/mapbox/dark-v10',
  Light: 'mapbox://styles/mapbox/light-v10',
  Outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
  SatelliteStreet: 'mapbox://styles/mapbox/satellite-streets-v11',
  TrafficDay: 'mapbox://styles/mapbox/traffic-day-v2',
  TrafficNight: 'mapbox://styles/mapbox/traffic-night-v2',
};

// Default export
const Mapbox = {
  MapView: MockMapView,
  Camera: MockCamera,
  MarkerView: MockMarkerView,
  PointAnnotation: MockPointAnnotation,
  Callout: MockCallout,
  ShapeSource: MockShapeSource,
  LineLayer: MockLineLayer,
  SymbolLayer: MockSymbolLayer,
  CircleLayer: MockCircleLayer,
  FillLayer: MockFillLayer,
  Images: MockImages,
  UserLocation: MockUserLocation,
  LocationPuck: MockLocationPuck,
  RasterSource: MockRasterSource,
  RasterLayer: MockRasterLayer,
  VectorSource: MockVectorSource,
  BackgroundLayer: MockBackgroundLayer,
  Atmosphere: MockAtmosphere,
  Terrain: MockTerrain,
  SkyLayer: MockSkyLayer,
  HeatmapLayer: MockHeatmapLayer,
  FillExtrusionLayer: MockFillExtrusionLayer,
  setAccessToken,
  getAccessToken,
  setTelemetryEnabled,
  requestAndroidLocationPermissions,
  setConnected,
  StyleURL,
};

export default Mapbox;
