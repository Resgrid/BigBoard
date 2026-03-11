import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDashboardStore } from '@/stores/dashboard/store';
import { CALLS_COLUMN_LABELS, type CallsColumnKey, DEFAULT_CALLS_COLUMN_ORDER, useCallsSettingsStore } from '@/stores/widget-settings/calls-settings-store';
import { DEFAULT_PERSONNEL_COLUMN_ORDER, PERSONNEL_COLUMN_LABELS, type PersonnelColumnKey, usePersonnelSettingsStore } from '@/stores/widget-settings/personnel-settings-store';
import { useWidgetSettingsStore } from '@/stores/widget-settings/store';
import { DEFAULT_UNITS_COLUMN_ORDER, UNITS_COLUMN_LABELS, type UnitsColumnKey, useUnitsSettingsStore } from '@/stores/widget-settings/units-settings-store';
import { WidgetType } from '@/types/widget';

type TabType = 'personnel' | 'map' | 'weather' | 'units' | 'calls' | 'notes' | 'time' | 'personnelStatusSummary' | 'personnelStaffingSummary' | 'unitsSummary' | 'callsSummary';

interface WidgetSizeSectionProps {
  widgetType: string;
  defaultW?: number;
  defaultH?: number;
  isDark: boolean;
}

const WidgetSizeSection: React.FC<WidgetSizeSectionProps> = ({ widgetType, defaultW = 2, defaultH = 2, isDark }) => {
  const { widgets } = useDashboardStore();
  const widget = widgets.find((w) => w.type === widgetType);
  const [localW, setLocalW] = useState(() => widget?.w ?? defaultW);
  const [localH, setLocalH] = useState(() => widget?.h ?? defaultH);

  return (
    <VStack space="md">
      <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Widget Size</Text>
      <VStack space="sm">
        <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Width (grid units): {localW}</Text>
        <Slider
          value={localW}
          onChange={(value) => {
            const rounded = Math.round(value);
            setLocalW(rounded);
            if (widget && rounded !== widget.w) {
              useDashboardStore.getState().updateWidgetLayout(widget.id, { w: rounded });
            }
          }}
          minValue={1}
          maxValue={4}
          step={1}
          className="w-full"
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </VStack>
      <VStack space="sm">
        <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Height (grid units): {localH}</Text>
        <Slider
          value={localH}
          onChange={(value) => {
            const rounded = Math.round(value);
            setLocalH(rounded);
            if (widget && rounded !== widget.h) {
              useDashboardStore.getState().updateWidgetLayout(widget.id, { h: rounded });
            }
          }}
          minValue={1}
          maxValue={5}
          step={1}
          className="w-full"
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </VStack>
    </VStack>
  );
};

interface FontSizeSectionProps {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
  isDark: boolean;
}

const FontSizeSection: React.FC<FontSizeSectionProps> = ({ value, onChange, onChangeEnd, isDark }) => (
  <VStack space="md">
    <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Font Size: {value}pt</Text>
    <Slider value={value} onChange={onChange} onChangeEnd={onChangeEnd} minValue={4} maxValue={30} step={1} className="w-full">
      <SliderTrack>
        <SliderFilledTrack />
      </SliderTrack>
      <SliderThumb />
    </Slider>
    <HStack className="justify-between">
      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>4pt</Text>
      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>30pt</Text>
    </HStack>
  </VStack>
);

export default function Configure() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { widgets } = useDashboardStore();
  const {
    personnel,
    map,
    weather,
    units,
    calls,
    notes,
    time,
    personnelStatusSummary,
    personnelStaffingSummary,
    unitsSummary,
    callsSummary,
    updatePersonnelSettings,
    updateMapSettings,
    updateWeatherSettings,
    updateUnitsSettings,
    updateCallsSettings,
    updateNotesSettings,
    updateTimeSettings,
    updatePersonnelStatusSummarySettings,
    updatePersonnelStaffingSummarySettings,
    updateUnitsSummarySettings,
    updateCallsSummarySettings,
  } = useWidgetSettingsStore();

  const { settings: personnelSettings, updateSettings: updatePersonnelColumnSettings } = usePersonnelSettingsStore();
  const { settings: unitsSettings, updateSettings: updateUnitsColumnSettings } = useUnitsSettingsStore();
  const { settings: callsColumnSettings, updateSettings: updateCallsColumnSettings } = useCallsSettingsStore();

  const personnelColumnOrder: PersonnelColumnKey[] = personnelSettings.columnOrder?.length ? personnelSettings.columnOrder : DEFAULT_PERSONNEL_COLUMN_ORDER;
  const unitsColumnOrder: UnitsColumnKey[] = unitsSettings.columnOrder?.length ? unitsSettings.columnOrder : DEFAULT_UNITS_COLUMN_ORDER;
  const callsColumnOrder: CallsColumnKey[] = callsColumnSettings.columnOrder?.length ? callsColumnSettings.columnOrder : DEFAULT_CALLS_COLUMN_ORDER;

  const moveColumn = <T extends string>(order: T[], index: number, direction: 'up' | 'down', onUpdate: (newOrder: T[]) => void) => {
    const newOrder = [...order];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onUpdate(newOrder);
  };

  const renderColumnOrderEditor = <T extends string>(order: T[], labels: Record<T, string>, onUpdate: (newOrder: T[]) => void) => (
    <VStack space="sm">
      {order.map((col, index) => (
        <HStack key={col} className="items-center justify-between" space="sm">
          <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{labels[col]}</Text>
          <HStack space="xs">
            <Button size="sm" variant="outline" onPress={() => moveColumn(order, index, 'up', onUpdate)} isDisabled={index === 0} className="px-2">
              <ChevronUp size={14} color={isDark ? '#9ca3af' : '#4b5563'} />
            </Button>
            <Button size="sm" variant="outline" onPress={() => moveColumn(order, index, 'down', onUpdate)} isDisabled={index === order.length - 1} className="px-2">
              <ChevronDown size={14} color={isDark ? '#9ca3af' : '#4b5563'} />
            </Button>
          </HStack>
        </HStack>
      ))}
    </VStack>
  );

  const [activeTab, setActiveTab] = useState<TabType>('personnel');

  // Local state for font size sliders to break the onChange -> store update -> re-render cycle
  const [fontSizes, setFontSizes] = useState({
    personnel: personnel.fontSize,
    units: units.fontSize,
    calls: calls.fontSize,
    callsDispatchSpeed: calls.dispatchScrollSpeed ?? 40,
    personnelStatusSummary: personnelStatusSummary.fontSize,
    personnelStaffingSummary: personnelStaffingSummary.fontSize,
    unitsSummary: unitsSummary.fontSize,
    callsSummary: callsSummary.fontSize,
    callsSummaryMaxPriorities: callsSummary.maxPrioritiesToShow,
  });

  const handleSave = () => {
    router.back();
  };

  // Check which widgets are active
  const hasWidget = (type: WidgetType) => widgets.some((w) => w.type === type);

  const tabs: { key: TabType; label: string; widgetType: WidgetType }[] = [
    { key: 'personnel', label: 'Personnel', widgetType: WidgetType.PERSONNEL },
    { key: 'map', label: 'Map', widgetType: WidgetType.MAP },
    { key: 'weather', label: 'Weather', widgetType: WidgetType.WEATHER },
    { key: 'units', label: 'Units', widgetType: WidgetType.UNITS },
    { key: 'calls', label: 'Calls', widgetType: WidgetType.CALLS },
    { key: 'notes', label: 'Notes', widgetType: WidgetType.NOTES },
    { key: 'time', label: 'Time', widgetType: WidgetType.TIME },
    { key: 'personnelStatusSummary', label: 'Personnel Status', widgetType: WidgetType.PERSONNEL_STATUS_SUMMARY },
    { key: 'personnelStaffingSummary', label: 'Personnel Staffing', widgetType: WidgetType.PERSONNEL_STAFFING_SUMMARY },
    { key: 'unitsSummary', label: 'Units Summary', widgetType: WidgetType.UNITS_SUMMARY },
    { key: 'callsSummary', label: 'Calls Summary', widgetType: WidgetType.CALLS_SUMMARY },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personnel':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Personnel Widget</Text>

            {/* Visible Columns */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Visible Columns</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Group</Text>
                <Switch value={personnel.showGroup} onValueChange={(value) => updatePersonnelSettings({ showGroup: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Staffing</Text>
                <Switch value={personnel.showStaffing} onValueChange={(value) => updatePersonnelSettings({ showStaffing: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Status</Text>
                <Switch value={personnel.showStatus} onValueChange={(value) => updatePersonnelSettings({ showStatus: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Roles</Text>
                <Switch value={personnel.showRoles} onValueChange={(value) => updatePersonnelSettings({ showRoles: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Timestamp</Text>
                <Switch value={personnel.showTimestamp} onValueChange={(value) => updatePersonnelSettings({ showTimestamp: value })} />
              </HStack>
            </VStack>

            {/* Column Order */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Column Order</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Use arrows to reorder columns</Text>
              {renderColumnOrderEditor(personnelColumnOrder, PERSONNEL_COLUMN_LABELS, (newOrder) => updatePersonnelColumnSettings({ columnOrder: newOrder }))}
            </VStack>

            {/* Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Options</Text>

              <VStack space="sm">
                <HStack className="items-center justify-between">
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Sort Responding to Top</Text>
                  <Switch value={personnel.sortRespondingToTop} onValueChange={(value) => updatePersonnelSettings({ sortRespondingToTop: value })} />
                </HStack>
                <Input variant="outline" size="md">
                  <InputField placeholder="Responding Text" value={personnel.respondingText} onChangeText={(text) => updatePersonnelSettings({ respondingText: text })} />
                </Input>
              </VStack>

              <VStack space="sm">
                <HStack className="items-center justify-between">
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Hide Not Responding</Text>
                  <Switch value={personnel.hideNotResponding} onValueChange={(value) => updatePersonnelSettings({ hideNotResponding: value })} />
                </HStack>
                <Input variant="outline" size="md">
                  <InputField placeholder="Not Responding Text" value={personnel.notRespondingText} onChangeText={(text) => updatePersonnelSettings({ notRespondingText: text })} />
                </Input>
              </VStack>

              <VStack space="sm">
                <HStack className="items-center justify-between">
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Hide Unavailable</Text>
                  <Switch value={personnel.hideUnavailable} onValueChange={(value) => updatePersonnelSettings({ hideUnavailable: value })} />
                </HStack>
                <Input variant="outline" size="md">
                  <InputField placeholder="Unavailable Text" value={personnel.unavailableText} onChangeText={(text) => updatePersonnelSettings({ unavailableText: text })} />
                </Input>
              </VStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection
              value={fontSizes.personnel}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, personnel: value }))}
              onChangeEnd={(value) => updatePersonnelSettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="personnel" defaultW={2} defaultH={2} isDark={isDark} />
          </VStack>
        );

      case 'map':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Map Widget</Text>

            {/* Map Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Map Options</Text>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Zoom Level: {map.zoomLevel}</Text>
                <Input variant="outline" size="md">
                  <InputField placeholder="Zoom Level" value={map.zoomLevel.toString()} onChangeText={(text) => updateMapSettings({ zoomLevel: parseInt(text) || 12 })} keyboardType="numeric" />
                </Input>
              </VStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Zoom Out to Show All Pins</Text>
                <Switch value={map.showAllMarkers} onValueChange={(value) => updateMapSettings({ showAllMarkers: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Hide Labels</Text>
                <Switch value={map.hideLabels} onValueChange={(value) => updateMapSettings({ hideLabels: value })} />
              </HStack>
            </VStack>

            {/* Visible Pins */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Visible Pins</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Calls</Text>
                <Switch value={map.showCalls} onValueChange={(value) => updateMapSettings({ showCalls: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Linked Calls</Text>
                <Switch value={map.showLinkedCalls} onValueChange={(value) => updateMapSettings({ showLinkedCalls: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Stations</Text>
                <Switch value={map.showStations} onValueChange={(value) => updateMapSettings({ showStations: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Units</Text>
                <Switch value={map.showUnits} onValueChange={(value) => updateMapSettings({ showUnits: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Personnel</Text>
                <Switch value={map.showPersonnel} onValueChange={(value) => updateMapSettings({ showPersonnel: value })} />
              </HStack>
            </VStack>

            {/* Map Center */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Map Center</Text>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Latitude</Text>
                <Input variant="outline" size="md">
                  <InputField placeholder="Latitude" value={map.latitude.toString()} onChangeText={(text) => updateMapSettings({ latitude: parseFloat(text) || 0 })} keyboardType="numeric" />
                </Input>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Longitude</Text>
                <Input variant="outline" size="md">
                  <InputField placeholder="Longitude" value={map.longitude.toString()} onChangeText={(text) => updateMapSettings({ longitude: parseFloat(text) || 0 })} keyboardType="numeric" />
                </Input>
              </VStack>
            </VStack>

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="map" defaultW={2} defaultH={3} isDark={isDark} />
          </VStack>
        );

      case 'weather':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Weather Widget</Text>

            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Options</Text>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Units</Text>
                <HStack space="sm">
                  <Button variant={weather.units === 'standard' ? 'solid' : 'outline'} onPress={() => updateWeatherSettings({ units: 'standard' })} className="flex-1">
                    <ButtonText>Standard</ButtonText>
                  </Button>
                  <Button variant={weather.units === 'metric' ? 'solid' : 'outline'} onPress={() => updateWeatherSettings({ units: 'metric' })} className="flex-1">
                    <ButtonText>Metric</ButtonText>
                  </Button>
                  <Button variant={weather.units === 'imperial' ? 'solid' : 'outline'} onPress={() => updateWeatherSettings({ units: 'imperial' })} className="flex-1">
                    <ButtonText>Imperial</ButtonText>
                  </Button>
                </HStack>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Latitude</Text>
                <Input variant="outline" size="md">
                  <InputField placeholder="Latitude" value={weather.latitude.toString()} onChangeText={(text) => updateWeatherSettings({ latitude: parseFloat(text) || 0 })} keyboardType="numeric" />
                </Input>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Longitude</Text>
                <Input variant="outline" size="md">
                  <InputField placeholder="Longitude" value={weather.longitude.toString()} onChangeText={(text) => updateWeatherSettings({ longitude: parseFloat(text) || 0 })} keyboardType="numeric" />
                </Input>
              </VStack>
            </VStack>

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="weather" defaultW={2} defaultH={2} isDark={isDark} />
          </VStack>
        );

      case 'units':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Units Widget</Text>

            {/* Visible Columns */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Visible Columns</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Station</Text>
                <Switch value={units.showStation} onValueChange={(value) => updateUnitsSettings({ showStation: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Type</Text>
                <Switch value={units.showType} onValueChange={(value) => updateUnitsSettings({ showType: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>State</Text>
                <Switch value={units.showState} onValueChange={(value) => updateUnitsSettings({ showState: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Timestamp</Text>
                <Switch value={units.showTimestamp} onValueChange={(value) => updateUnitsSettings({ showTimestamp: value })} />
              </HStack>
            </VStack>

            {/* Column Order */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Column Order</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Use arrows to reorder columns</Text>
              {renderColumnOrderEditor(unitsColumnOrder, UNITS_COLUMN_LABELS, (newOrder) => updateUnitsColumnSettings({ columnOrder: newOrder }))}
            </VStack>

            {/* Font Size */}
            <FontSizeSection value={fontSizes.units} onChange={(value) => setFontSizes((prev) => ({ ...prev, units: value }))} onChangeEnd={(value) => updateUnitsSettings({ fontSize: value })} isDark={isDark} />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="units" defaultW={2} defaultH={2} isDark={isDark} />
          </VStack>
        );

      case 'calls':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Calls Widget</Text>

            {/* Visible Columns */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Visible Columns</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>ID</Text>
                <Switch value={calls.showId} onValueChange={(value) => updateCallsSettings({ showId: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Name</Text>
                <Switch value={calls.showName} onValueChange={(value) => updateCallsSettings({ showName: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Timestamp</Text>
                <Switch value={calls.showTimestamp} onValueChange={(value) => updateCallsSettings({ showTimestamp: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Logged By</Text>
                <Switch value={calls.showUser} onValueChange={(value) => updateCallsSettings({ showUser: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Priority</Text>
                <Switch value={calls.showPriority} onValueChange={(value) => updateCallsSettings({ showPriority: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Address</Text>
                <Switch value={calls.showAddress} onValueChange={(value) => updateCallsSettings({ showAddress: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Dispatched</Text>
                <Switch value={calls.showDispatched} onValueChange={(value) => updateCallsSettings({ showDispatched: value })} />
              </HStack>
            </VStack>

            {/* Column Order */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Column Order</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Use arrows to reorder columns</Text>
              {renderColumnOrderEditor(callsColumnOrder, CALLS_COLUMN_LABELS, (newOrder) => updateCallsColumnSettings({ columnOrder: newOrder }))}
            </VStack>

            {/* Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Linked Calls</Text>
                <Switch value={calls.showLinkedCalls} onValueChange={(value) => updateCallsSettings({ showLinkedCalls: value })} />
              </HStack>

              {/* Dispatch Scroll Speed */}
              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Dispatch Scroll Speed: {fontSizes.callsDispatchSpeed === 0 ? 'Off (manual)' : `${fontSizes.callsDispatchSpeed}px/s`}</Text>
                <Slider
                  value={fontSizes.callsDispatchSpeed}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, callsDispatchSpeed: Math.round(value) }))}
                  onChangeEnd={(value) => updateCallsSettings({ dispatchScrollSpeed: Math.round(value) })}
                  minValue={0}
                  maxValue={200}
                  step={5}
                  className="w-full"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <HStack className="justify-between">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Off</Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>200px/s</Text>
                </HStack>
              </VStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection value={fontSizes.calls} onChange={(value) => setFontSizes((prev) => ({ ...prev, calls: value }))} onChangeEnd={(value) => updateCallsSettings({ fontSize: value })} isDark={isDark} />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="calls" defaultW={2} defaultH={2} isDark={isDark} />
          </VStack>
        );

      case 'notes':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notes Widget</Text>

            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Options</Text>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Category</Text>
                <Input variant="outline" size="md">
                  <InputField placeholder="Note Category" value={notes.category} onChangeText={(text) => updateNotesSettings({ category: text })} />
                </Input>
              </VStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Include Uncategorized</Text>
                <Switch value={notes.includeUncategorized} onValueChange={(value) => updateNotesSettings({ includeUncategorized: value })} />
              </HStack>
            </VStack>

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="notes" defaultW={2} defaultH={1} isDark={isDark} />
          </VStack>
        );

      case 'time':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Time Widget</Text>

            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Display Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>24-Hour Format</Text>
                <Switch value={time.format24Hour} onValueChange={(value) => updateTimeSettings({ format24Hour: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Seconds</Text>
                <Switch value={time.showSeconds} onValueChange={(value) => updateTimeSettings({ showSeconds: value })} />
              </HStack>
            </VStack>

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="time" defaultW={1} defaultH={1} isDark={isDark} />
          </VStack>
        );

      case 'personnelStatusSummary':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Personnel Status Summary Widget</Text>

            {/* Display Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Display Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Colors</Text>
                <Switch value={personnelStatusSummary.showColors} onValueChange={(value) => updatePersonnelStatusSummarySettings({ showColors: value })} />
              </HStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection
              value={fontSizes.personnelStatusSummary}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, personnelStatusSummary: value }))}
              onChangeEnd={(value) => updatePersonnelStatusSummarySettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="personnel_status_summary" defaultW={1} defaultH={1} isDark={isDark} />
          </VStack>
        );

      case 'personnelStaffingSummary':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Personnel Staffing Summary Widget</Text>

            {/* Display Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Display Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Colors</Text>
                <Switch value={personnelStaffingSummary.showColors} onValueChange={(value) => updatePersonnelStaffingSummarySettings({ showColors: value })} />
              </HStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection
              value={fontSizes.personnelStaffingSummary}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, personnelStaffingSummary: value }))}
              onChangeEnd={(value) => updatePersonnelStaffingSummarySettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="personnel_staffing_summary" defaultW={1} defaultH={1} isDark={isDark} />
          </VStack>
        );

      case 'unitsSummary':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Units Summary Widget</Text>

            {/* Display Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Display Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Available</Text>
                <Switch value={unitsSummary.showAvailable} onValueChange={(value) => updateUnitsSummarySettings({ showAvailable: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Responding</Text>
                <Switch value={unitsSummary.showResponding} onValueChange={(value) => updateUnitsSummarySettings({ showResponding: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show On Scene</Text>
                <Switch value={unitsSummary.showOnScene} onValueChange={(value) => updateUnitsSummarySettings({ showOnScene: value })} />
              </HStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection
              value={fontSizes.unitsSummary}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, unitsSummary: value }))}
              onChangeEnd={(value) => updateUnitsSummarySettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="units_summary" defaultW={1} defaultH={1} isDark={isDark} />
          </VStack>
        );

      case 'callsSummary':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Calls Summary Widget</Text>

            {/* Display Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Display Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Recent Call</Text>
                <Switch value={callsSummary.showRecentCall} onValueChange={(value) => updateCallsSummarySettings({ showRecentCall: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Priority Counts</Text>
                <Switch value={callsSummary.showPriorityCounts} onValueChange={(value) => updateCallsSummarySettings({ showPriorityCounts: value })} />
              </HStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Max Priorities to Show: {fontSizes.callsSummaryMaxPriorities}</Text>
                <Slider
                  value={fontSizes.callsSummaryMaxPriorities}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, callsSummaryMaxPriorities: Math.round(value) }))}
                  onChangeEnd={(value) => updateCallsSummarySettings({ maxPrioritiesToShow: Math.round(value) })}
                  minValue={1}
                  maxValue={10}
                  step={1}
                  className="w-full"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </VStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection
              value={fontSizes.callsSummary}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, callsSummary: value }))}
              onChangeEnd={(value) => updateCallsSummarySettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="calls_summary" defaultW={1} defaultH={1} isDark={isDark} />
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box className="flex-1" testID="configure-screen">
      <VStack className="flex-1" space="none">
        {/* Tab Navigation */}
        <Box className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
            <HStack space="xs" className="px-2 py-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'solid' : 'outline'}
                  size="sm"
                  onPress={() => setActiveTab(tab.key)}
                  className={`${activeTab === tab.key ? 'bg-primary-600' : ''} ${!hasWidget(tab.widgetType) ? 'opacity-50' : ''}`}
                  testID={`configure-tab-${tab.key}`}
                >
                  <ButtonText className={activeTab === tab.key ? 'text-white' : ''}>{tab.label}</ButtonText>
                </Button>
              ))}
            </HStack>
          </ScrollView>
        </Box>

        {/* Tab Content */}
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}>
          {renderTabContent()}
        </ScrollView>

        {/* Save Button */}
        <Box className={`border-t p-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <Button onPress={handleSave} size="lg" testID="configure-save-button">
            <ButtonText>Save</ButtonText>
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
