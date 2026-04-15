import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useGridConfig } from '@/hooks/use-grid-config';
import { useDashboardStore } from '@/stores/dashboard/store';
import { CALLS_COLUMN_LABELS, type CallsColumnKey, DEFAULT_CALLS_COLUMN_ORDER, useCallsSettingsStore } from '@/stores/widget-settings/calls-settings-store';
import { DEFAULT_PERSONNEL_COLUMN_ORDER, PERSONNEL_COLUMN_LABELS, type PersonnelColumnKey, usePersonnelSettingsStore } from '@/stores/widget-settings/personnel-settings-store';
import { DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER, SCHEDULED_CALLS_COLUMN_LABELS, type ScheduledCallsColumnKey, useScheduledCallsSettingsStore } from '@/stores/widget-settings/scheduled-calls-settings-store';
import { useWidgetSettingsStore } from '@/stores/widget-settings/store';
import { DEFAULT_UNITS_COLUMN_ORDER, UNITS_COLUMN_LABELS, type UnitsColumnKey, useUnitsSettingsStore } from '@/stores/widget-settings/units-settings-store';
import { WidgetType } from '@/types/widget';

type TabType = 'personnel' | 'map' | 'weather' | 'units' | 'calls' | 'notes' | 'time' | 'personnelStatusSummary' | 'personnelStaffingSummary' | 'unitsSummary' | 'callsSummary' | 'weatherAlerts' | 'scheduledCalls';

interface WidgetSizeSectionProps {
  widgetType: string;
  defaultW?: number;
  defaultH?: number;
  isDark: boolean;
}

const WidgetSizeSection: React.FC<WidgetSizeSectionProps> = ({ widgetType, defaultW = 2, defaultH = 2, isDark }) => {
  const { widgets, updateWidgetLayout } = useDashboardStore();
  const { t } = useTranslation();
  const gridConfig = useGridConfig();
  const widget = widgets.find((w) => w.type === widgetType);

  // Cap slider max at sensible values so the slider remains usable on wide screens
  const maxW = Math.min(gridConfig.maxWidgetWidth, 8);
  const maxH = Math.min(gridConfig.maxWidgetHeight, 10);

  const [localW, setLocalW] = useState(() => Math.min(widget?.w ?? defaultW, maxW));
  const [localH, setLocalH] = useState(() => Math.min(widget?.h ?? defaultH, maxH));

  // Keep local slider state in sync with the store (e.g., after migration or external update)
  useEffect(() => {
    if (widget) {
      setLocalW(Math.min(widget.w || 1, maxW));
      setLocalH(Math.min(widget.h || 1, maxH));
    }
  }, [widget?.id, widget?.w, widget?.h, maxW, maxH]);

  if (!widget) {
    return null;
  }

  return (
    <VStack space="md">
      <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.widget_size')}</Text>
      <VStack space="sm">
        <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.width_grid_units', { value: localW })}</Text>
        <Slider
          value={localW}
          onChange={(value) => {
            const rounded = Math.max(1, Math.min(Math.round(value), maxW));
            setLocalW(rounded);
            if (rounded !== widget.w) {
              updateWidgetLayout(widget.id, { w: rounded });
            }
          }}
          minValue={1}
          maxValue={maxW}
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
        <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.height_grid_units', { value: localH })}</Text>
        <Slider
          value={localH}
          onChange={(value) => {
            const rounded = Math.max(1, Math.min(Math.round(value), maxH));
            setLocalH(rounded);
            if (rounded !== widget.h) {
              updateWidgetLayout(widget.id, { h: rounded });
            }
          }}
          minValue={1}
          maxValue={maxH}
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

const FontSizeSection: React.FC<FontSizeSectionProps> = ({ value, onChange, onChangeEnd, isDark }) => {
  const { t } = useTranslation();
  return (
    <VStack space="md">
      <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.font_size', { value })}</Text>
      <Slider value={value} onChange={onChange} onChangeEnd={onChangeEnd} minValue={4} maxValue={30} step={1} className="w-full">
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <HStack className="justify-between">
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('configure.font_size_min')}</Text>
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('configure.font_size_max')}</Text>
      </HStack>
    </VStack>
  );
};

export default function Configure() {
  const router = useRouter();
  const { t } = useTranslation();
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
    weatherAlerts: weatherAlertsSettings,
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
    updateWeatherAlertsSettings,
    scheduledCalls: scheduledCallsGlobalSettings,
    updateScheduledCallsSettings,
  } = useWidgetSettingsStore();

  const { settings: personnelSettings, updateSettings: updatePersonnelColumnSettings } = usePersonnelSettingsStore();
  const { settings: unitsSettings, updateSettings: updateUnitsColumnSettings } = useUnitsSettingsStore();
  const { settings: callsColumnSettings, updateSettings: updateCallsColumnSettings } = useCallsSettingsStore();
  const { settings: scheduledCallsSettings, updateSettings: updateScheduledCallsColumnSettings } = useScheduledCallsSettingsStore();

  const personnelColumnOrder: PersonnelColumnKey[] = personnelSettings.columnOrder?.length ? personnelSettings.columnOrder : DEFAULT_PERSONNEL_COLUMN_ORDER;
  const unitsColumnOrder: UnitsColumnKey[] = unitsSettings.columnOrder?.length ? unitsSettings.columnOrder : DEFAULT_UNITS_COLUMN_ORDER;
  const callsColumnOrder: CallsColumnKey[] = callsColumnSettings.columnOrder?.length ? callsColumnSettings.columnOrder : DEFAULT_CALLS_COLUMN_ORDER;
  const scheduledCallsColumnOrder: ScheduledCallsColumnKey[] = scheduledCallsSettings.columnOrder?.length ? scheduledCallsSettings.columnOrder : DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER;

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
          <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t(labels[col])}</Text>
          <HStack space="xs">
            <Button
              size="sm"
              variant="outline"
              onPress={() => moveColumn(order, index, 'up', onUpdate)}
              isDisabled={index === 0}
              className="px-2"
              accessibilityLabel={t('configure.move_column_up', { columnName: t(labels[col]) })}
              aria-label={t('configure.move_column_up', { columnName: t(labels[col]) })}
            >
              <ChevronUp size={14} color={isDark ? '#9ca3af' : '#4b5563'} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => moveColumn(order, index, 'down', onUpdate)}
              isDisabled={index === order.length - 1}
              className="px-2"
              accessibilityLabel={t('configure.move_column_down', { columnName: t(labels[col]) })}
              aria-label={t('configure.move_column_down', { columnName: t(labels[col]) })}
            >
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
    weatherAlerts: weatherAlertsSettings.fontSize,
    weatherAlertsMaxInWidget: weatherAlertsSettings.maxAlertsInWidget,
    scheduledCalls: scheduledCallsSettings.fontSize,
    scheduledCallsDispatchSpeed: scheduledCallsSettings.dispatchScrollSpeed ?? 40,
    scheduledCallsRedThreshold: scheduledCallsSettings.colorThresholdRedMinutes,
    scheduledCallsYellowThreshold: scheduledCallsSettings.colorThresholdYellowMinutes,
    scheduledCallsGreenThreshold: scheduledCallsSettings.colorThresholdGreenMinutes,
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
    { key: 'weatherAlerts', label: 'Weather Alerts', widgetType: WidgetType.WEATHER_ALERTS },
    { key: 'scheduledCalls', label: 'Scheduled Calls', widgetType: WidgetType.SCHEDULED_CALLS },
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
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.column_order')}</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('configure.use_arrows_reorder')}</Text>
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
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.column_order')}</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('configure.use_arrows_reorder')}</Text>
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
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.id')}</Text>
                <Switch value={calls.showId} onValueChange={(value) => updateCallsSettings({ showId: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.name')}</Text>
                <Switch value={calls.showName} onValueChange={(value) => updateCallsSettings({ showName: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.timestamp')}</Text>
                <Switch value={calls.showTimestamp} onValueChange={(value) => updateCallsSettings({ showTimestamp: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.logged_by')}</Text>
                <Switch value={calls.showUser} onValueChange={(value) => updateCallsSettings({ showUser: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.priority')}</Text>
                <Switch value={calls.showPriority} onValueChange={(value) => updateCallsSettings({ showPriority: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.address')}</Text>
                <Switch value={calls.showAddress} onValueChange={(value) => updateCallsSettings({ showAddress: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('configure.dispatched')}</Text>
                <Switch value={calls.showDispatched} onValueChange={(value) => updateCallsSettings({ showDispatched: value })} />
              </HStack>
            </VStack>

            {/* Column Order */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.column_order')}</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('configure.use_arrows_reorder')}</Text>
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
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {t('configure.dispatch_scroll_speed', { speed: fontSizes.callsDispatchSpeed === 0 ? t('configure.dispatch_scroll_off') : `${fontSizes.callsDispatchSpeed}px/s` })}
                </Text>
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
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('configure.speed_off')}</Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('configure.speed_max')}</Text>
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

      case 'weatherAlerts':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Weather Alerts Widget</Text>

            {/* Severity Filters */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Severity Levels</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Extreme</Text>
                <Switch value={weatherAlertsSettings.showExtreme} onValueChange={(value) => updateWeatherAlertsSettings({ showExtreme: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Severe</Text>
                <Switch value={weatherAlertsSettings.showSevere} onValueChange={(value) => updateWeatherAlertsSettings({ showSevere: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Moderate</Text>
                <Switch value={weatherAlertsSettings.showModerate} onValueChange={(value) => updateWeatherAlertsSettings({ showModerate: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Minor</Text>
                <Switch value={weatherAlertsSettings.showMinor} onValueChange={(value) => updateWeatherAlertsSettings({ showMinor: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Unknown</Text>
                <Switch value={weatherAlertsSettings.showUnknown} onValueChange={(value) => updateWeatherAlertsSettings({ showUnknown: value })} />
              </HStack>
            </VStack>

            {/* Category Filters */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Alert Categories</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Geophysical</Text>
                <Switch value={weatherAlertsSettings.showCategoryGeo} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryGeo: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Meteorological</Text>
                <Switch value={weatherAlertsSettings.showCategoryMet} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryMet: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Safety</Text>
                <Switch value={weatherAlertsSettings.showCategorySafety} onValueChange={(value) => updateWeatherAlertsSettings({ showCategorySafety: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Fire</Text>
                <Switch value={weatherAlertsSettings.showCategoryFire} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryFire: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Health</Text>
                <Switch value={weatherAlertsSettings.showCategoryHealth} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryHealth: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Environmental</Text>
                <Switch value={weatherAlertsSettings.showCategoryEnv} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryEnv: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Transport</Text>
                <Switch value={weatherAlertsSettings.showCategoryTransport} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryTransport: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Infrastructure</Text>
                <Switch value={weatherAlertsSettings.showCategoryInfra} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryInfra: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Other</Text>
                <Switch value={weatherAlertsSettings.showCategoryOther} onValueChange={(value) => updateWeatherAlertsSettings({ showCategoryOther: value })} />
              </HStack>
            </VStack>

            {/* Display Options */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Display Options</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Headline</Text>
                <Switch value={weatherAlertsSettings.showHeadline} onValueChange={(value) => updateWeatherAlertsSettings({ showHeadline: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Area</Text>
                <Switch value={weatherAlertsSettings.showArea} onValueChange={(value) => updateWeatherAlertsSettings({ showArea: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Expiry Time</Text>
                <Switch value={weatherAlertsSettings.showExpiry} onValueChange={(value) => updateWeatherAlertsSettings({ showExpiry: value })} />
              </HStack>

              {/* Max Alerts in Widget */}
              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Max Alerts in Widget: {fontSizes.weatherAlertsMaxInWidget}</Text>
                <Slider
                  value={fontSizes.weatherAlertsMaxInWidget}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, weatherAlertsMaxInWidget: Math.round(value) }))}
                  onChangeEnd={(value) => updateWeatherAlertsSettings({ maxAlertsInWidget: Math.round(value) })}
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
              value={fontSizes.weatherAlerts}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, weatherAlerts: value }))}
              onChangeEnd={(value) => updateWeatherAlertsSettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="weather_alerts" defaultW={1} defaultH={1} isDark={isDark} />
          </VStack>
        );

      case 'scheduledCalls':
        return (
          <VStack space="lg" className="p-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Scheduled Calls Widget</Text>

            {/* Visible Columns */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Visible Columns</Text>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Name</Text>
                <Switch value={scheduledCallsSettings.showName} onValueChange={(value) => updateScheduledCallsColumnSettings({ showName: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Scheduled Time</Text>
                <Switch value={scheduledCallsSettings.showScheduledTime} onValueChange={(value) => updateScheduledCallsColumnSettings({ showScheduledTime: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Priority</Text>
                <Switch value={scheduledCallsSettings.showPriority} onValueChange={(value) => updateScheduledCallsColumnSettings({ showPriority: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Address</Text>
                <Switch value={scheduledCallsSettings.showAddress} onValueChange={(value) => updateScheduledCallsColumnSettings({ showAddress: value })} />
              </HStack>

              <HStack className="items-center justify-between">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Dispatched</Text>
                <Switch value={scheduledCallsSettings.showDispatched} onValueChange={(value) => updateScheduledCallsColumnSettings({ showDispatched: value })} />
              </HStack>
            </VStack>

            {/* Column Order */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.column_order')}</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('configure.use_arrows_reorder')}</Text>
              {renderColumnOrderEditor(scheduledCallsColumnOrder, SCHEDULED_CALLS_COLUMN_LABELS, (newOrder) => updateScheduledCallsColumnSettings({ columnOrder: newOrder }))}
            </VStack>

            {/* Sorting */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sorting</Text>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Sort By</Text>
                <HStack space="sm">
                  <Button variant={scheduledCallsSettings.sortBy === 'scheduledTime' ? 'solid' : 'outline'} onPress={() => updateScheduledCallsColumnSettings({ sortBy: 'scheduledTime' })} className="flex-1">
                    <ButtonText>Time</ButtonText>
                  </Button>
                  <Button variant={scheduledCallsSettings.sortBy === 'priority' ? 'solid' : 'outline'} onPress={() => updateScheduledCallsColumnSettings({ sortBy: 'priority' })} className="flex-1">
                    <ButtonText>Priority</ButtonText>
                  </Button>
                  <Button variant={scheduledCallsSettings.sortBy === 'name' ? 'solid' : 'outline'} onPress={() => updateScheduledCallsColumnSettings({ sortBy: 'name' })} className="flex-1">
                    <ButtonText>Name</ButtonText>
                  </Button>
                </HStack>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Sort Order</Text>
                <HStack space="sm">
                  <Button variant={scheduledCallsSettings.sortOrder === 'asc' ? 'solid' : 'outline'} onPress={() => updateScheduledCallsColumnSettings({ sortOrder: 'asc' })} className="flex-1">
                    <ButtonText>Ascending</ButtonText>
                  </Button>
                  <Button variant={scheduledCallsSettings.sortOrder === 'desc' ? 'solid' : 'outline'} onPress={() => updateScheduledCallsColumnSettings({ sortOrder: 'desc' })} className="flex-1">
                    <ButtonText>Descending</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </VStack>

            {/* Filtering */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filtering</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enter comma-separated IDs to filter. Leave empty to show all.</Text>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Group/Station IDs</Text>
                <Input variant="outline" size="md">
                  <InputField
                    placeholder="e.g. 123,456"
                    value={scheduledCallsSettings.filterGroupIds.join(',')}
                    onChangeText={(text) =>
                      updateScheduledCallsColumnSettings({
                        filterGroupIds: text
                          ? text
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [],
                      })
                    }
                  />
                </Input>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Unit IDs</Text>
                <Input variant="outline" size="md">
                  <InputField
                    placeholder="e.g. 123,456"
                    value={scheduledCallsSettings.filterUnitIds.join(',')}
                    onChangeText={(text) =>
                      updateScheduledCallsColumnSettings({
                        filterUnitIds: text
                          ? text
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [],
                      })
                    }
                  />
                </Input>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Personnel IDs</Text>
                <Input variant="outline" size="md">
                  <InputField
                    placeholder="e.g. user-id-1,user-id-2"
                    value={scheduledCallsSettings.filterPersonnelIds.join(',')}
                    onChangeText={(text) =>
                      updateScheduledCallsColumnSettings({
                        filterPersonnelIds: text
                          ? text
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [],
                      })
                    }
                  />
                </Input>
              </VStack>

              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Role IDs</Text>
                <Input variant="outline" size="md">
                  <InputField
                    placeholder="e.g. 123,456"
                    value={scheduledCallsSettings.filterRoleIds.join(',')}
                    onChangeText={(text) =>
                      updateScheduledCallsColumnSettings({
                        filterRoleIds: text
                          ? text
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [],
                      })
                    }
                  />
                </Input>
              </VStack>
            </VStack>

            {/* Color Coding Thresholds */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Urgency Color Coding</Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Color-code rows based on how soon a scheduled call will activate.</Text>

              <VStack space="sm">
                <HStack className="items-center" space="sm">
                  <Box style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: scheduledCallsSettings.colorRedHex }} />
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Red threshold: {fontSizes.scheduledCallsRedThreshold} min</Text>
                </HStack>
                <Slider
                  value={fontSizes.scheduledCallsRedThreshold}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, scheduledCallsRedThreshold: Math.round(value) }))}
                  onChangeEnd={(value) => updateScheduledCallsColumnSettings({ colorThresholdRedMinutes: Math.round(value) })}
                  minValue={1}
                  maxValue={120}
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
                <HStack className="items-center" space="sm">
                  <Box style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: scheduledCallsSettings.colorYellowHex }} />
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Yellow threshold: {fontSizes.scheduledCallsYellowThreshold} min</Text>
                </HStack>
                <Slider
                  value={fontSizes.scheduledCallsYellowThreshold}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, scheduledCallsYellowThreshold: Math.round(value) }))}
                  onChangeEnd={(value) => updateScheduledCallsColumnSettings({ colorThresholdYellowMinutes: Math.round(value) })}
                  minValue={15}
                  maxValue={480}
                  step={5}
                  className="w-full"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </VStack>

              <VStack space="sm">
                <HStack className="items-center" space="sm">
                  <Box style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: scheduledCallsSettings.colorGreenHex }} />
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Green threshold: {fontSizes.scheduledCallsGreenThreshold} min</Text>
                </HStack>
                <Slider
                  value={fontSizes.scheduledCallsGreenThreshold}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, scheduledCallsGreenThreshold: Math.round(value) }))}
                  onChangeEnd={(value) => updateScheduledCallsColumnSettings({ colorThresholdGreenMinutes: Math.round(value) })}
                  minValue={60}
                  maxValue={1440}
                  step={15}
                  className="w-full"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </VStack>

              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Gray = more than {scheduledCallsSettings.colorThresholdGreenMinutes} min away</Text>
            </VStack>

            {/* Dispatch Scroll Speed */}
            <VStack space="md">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Options</Text>
              <VStack space="sm">
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {t('configure.dispatch_scroll_speed', { speed: fontSizes.scheduledCallsDispatchSpeed === 0 ? t('configure.dispatch_scroll_off') : `${fontSizes.scheduledCallsDispatchSpeed}px/s` })}
                </Text>
                <Slider
                  value={fontSizes.scheduledCallsDispatchSpeed}
                  onChange={(value) => setFontSizes((prev) => ({ ...prev, scheduledCallsDispatchSpeed: Math.round(value) }))}
                  onChangeEnd={(value) => updateScheduledCallsColumnSettings({ dispatchScrollSpeed: Math.round(value) })}
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
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('configure.speed_off')}</Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('configure.speed_max')}</Text>
                </HStack>
              </VStack>
            </VStack>

            {/* Font Size */}
            <FontSizeSection
              value={fontSizes.scheduledCalls}
              onChange={(value) => setFontSizes((prev) => ({ ...prev, scheduledCalls: value }))}
              onChangeEnd={(value) => updateScheduledCallsColumnSettings({ fontSize: value })}
              isDark={isDark}
            />

            {/* Widget Dimensions */}
            <WidgetSizeSection widgetType="scheduled_calls" defaultW={3} defaultH={3} isDark={isDark} />
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
