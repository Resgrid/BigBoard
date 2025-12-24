import React from 'react';

import type { Widget } from '@/types/widget';
import { WidgetType } from '@/types/widget';

import { CallsWidget } from './CallsWidget';
import { MapWidget } from './MapWidget';
import { NotesWidget } from './NotesWidget';
import { PersonnelWidget } from './PersonnelWidget';
import { TimeWidget } from './TimeWidget';
import { UnitsWidget } from './UnitsWidget';
import { WeatherWidget } from './WeatherWidget';
import { PersonnelStatusSummaryWidget } from './PersonnelStatusSummaryWidget';
import { PersonnelStaffingSummaryWidget } from './PersonnelStaffingSummaryWidget';
import { UnitsSummaryWidget } from './UnitsSummaryWidget';
import { CallsSummaryWidget } from './CallsSummaryWidget';

interface WidgetRendererProps {
  widget: Widget;
  onRemove?: () => void;
  isEditMode?: boolean;
  containerWidth?: number;
  containerHeight?: number;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, onRemove, isEditMode, containerWidth, containerHeight }) => {
  const { w, h, data } = widget;

  switch (widget.type) {
    case WidgetType.TIME:
      return <TimeWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} />;
    case WidgetType.PERSONNEL:
      return <PersonnelWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} />;
    case WidgetType.UNITS:
      return <UnitsWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} />;
    case WidgetType.CALLS:
      return <CallsWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} />;
    case WidgetType.MAP:
      return <MapWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} />;
    case WidgetType.WEATHER:
      return <WeatherWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} metadata={data} />;
    case WidgetType.NOTES:
      return <NotesWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} containerWidth={containerWidth} containerHeight={containerHeight} />;
    case WidgetType.PERSONNEL_STATUS_SUMMARY:
      return <PersonnelStatusSummaryWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} />;
    case WidgetType.PERSONNEL_STAFFING_SUMMARY:
      return <PersonnelStaffingSummaryWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} />;
    case WidgetType.UNITS_SUMMARY:
      return <UnitsSummaryWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} />;
    case WidgetType.CALLS_SUMMARY:
      return <CallsSummaryWidget onRemove={onRemove} isEditMode={isEditMode} width={w} height={h} />;
    default:
      return null;
  }
};
