import { Plus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDashboardStore } from '@/stores/dashboard/store';
import type { Widget } from '@/types/widget';
import { WIDGET_LABELS, WidgetType } from '@/types/widget';

import { WidgetRenderer } from './widgets/WidgetRenderer';

const BASE_WIDGET_WIDTH = 180;
const BASE_WIDGET_HEIGHT = 180;
const GRID_PADDING = 8;
const screenWidth = Dimensions.get('window').width;
const NUM_COLUMNS = Math.floor((screenWidth - GRID_PADDING * 2) / BASE_WIDGET_WIDTH);

// Calculate grid positions for widgets
const calculateGridLayout = (widgets: Widget[], numColumns: number) => {
  const grid: (string | null)[][] = [];
  const positions: Map<string, { x: number; y: number }> = new Map();

  widgets.forEach((widget) => {
    const w = Math.min(widget.w || 1, numColumns); // Ensure widget doesn't exceed columns
    const h = widget.h || 1;

    // Use stored position if valid, otherwise find first available position
    let targetX = widget.x;
    let targetY = widget.y;
    let placed = false;

    // First, try to place at stored position if it's set
    if (targetX >= 0 && targetY >= 0) {
      // Ensure grid has enough rows
      while (grid.length <= targetY + h - 1) {
        grid.push(Array(numColumns).fill(null));
      }

      // Check if stored position is available
      if (targetX + w <= numColumns) {
        let fits = true;
        for (let r = targetY; r < targetY + h && fits; r++) {
          for (let c = targetX; c < targetX + w && fits; c++) {
            if (grid[r]?.[c] !== null) {
              fits = false;
            }
          }
        }

        if (fits) {
          // Place at stored position
          for (let r = targetY; r < targetY + h; r++) {
            for (let c = targetX; c < targetX + w; c++) {
              grid[r][c] = widget.id;
            }
          }
          positions.set(widget.id, { x: targetX, y: targetY });
          placed = true;
        }
      }
    }

    // If not placed at stored position, find first available position
    if (!placed) {
      let row = 0;
      while (!placed) {
        // Ensure enough rows exist
        while (grid.length <= row + h - 1) {
          grid.push(Array(numColumns).fill(null));
        }

        // Try each column
        for (let col = 0; col <= numColumns - w; col++) {
          // Check if space is available
          let fits = true;
          for (let r = row; r < row + h && fits; r++) {
            for (let c = col; c < col + w && fits; c++) {
              if (grid[r]?.[c] !== null) {
                fits = false;
              }
            }
          }

          if (fits) {
            // Place widget
            for (let r = row; r < row + h; r++) {
              for (let c = col; c < col + w; c++) {
                grid[r][c] = widget.id;
              }
            }
            positions.set(widget.id, { x: col, y: row });
            placed = true;
            break;
          }
        }

        if (!placed) row++;
      }
    }
  });

  return positions;
};

// Draggable Widget Component
interface DraggableWidgetProps {
  widget: Widget;
  position: { x: number; y: number };
  isEditMode: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: (position: { x: number; y: number }) => void;
  onRemove: () => void;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ widget, position, isEditMode, isDragging, onDragStart, onDragEnd, onRemove }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const w = Math.min(widget.w || 1, NUM_COLUMNS);
  const h = widget.h || 1;
  const widgetWidth = w * BASE_WIDGET_WIDTH - 10;
  const widgetHeight = h * BASE_WIDGET_HEIGHT - 10;

  const baseX = position.x * BASE_WIDGET_WIDTH + GRID_PADDING;
  const baseY = position.y * BASE_WIDGET_HEIGHT + GRID_PADDING;

  // Reset position when not dragging
  React.useEffect(() => {
    if (!isDragging) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  }, [isDragging, translateX, translateY]);

  const gesture = Gesture.Pan()
    .enabled(isEditMode)
    .onStart(() => {
      runOnJS(onDragStart)();
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      // Calculate new grid position
      const newX = Math.round((baseX + translateX.value - GRID_PADDING) / BASE_WIDGET_WIDTH);
      const newY = Math.round((baseY + translateY.value - GRID_PADDING) / BASE_WIDGET_HEIGHT);

      // Clamp to valid grid positions
      const clampedX = Math.max(0, Math.min(NUM_COLUMNS - w, newX));
      const clampedY = Math.max(0, newY);

      runOnJS(onDragEnd)({ x: clampedX, y: clampedY });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.widgetContainer,
          {
            left: baseX,
            top: baseY,
            width: widgetWidth,
            height: widgetHeight,
          },
          animatedStyle,
        ]}
      >
        <WidgetRenderer widget={widget} onRemove={onRemove} isEditMode={isEditMode} containerWidth={widgetWidth} containerHeight={widgetHeight} />
      </Animated.View>
    </GestureDetector>
  );
};

export const Dashboard: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const { widgets, isEditMode, showAddMenu, setShowAddMenu, addWidget, removeWidget, updateWidgets } = useDashboardStore();

  // Calculate grid positions for all widgets
  const gridPositions = React.useMemo(() => {
    return calculateGridLayout(widgets, NUM_COLUMNS);
  }, [widgets]);

  const handleAddWidget = (type: WidgetType) => {
    addWidget(type);
  };

  const handleReorder = (draggedWidget: Widget, newPosition: { x: number; y: number }) => {
    const currentPosition = gridPositions.get(draggedWidget.id);
    
    // Only update if position actually changed
    if (!currentPosition || currentPosition.x !== newPosition.x || currentPosition.y !== newPosition.y) {
      const w = Math.min(draggedWidget.w || 1, NUM_COLUMNS);
      const h = draggedWidget.h || 1;

      // Check if new position would collide with any other widgets
      let hasCollision = false;
      const otherWidgets = widgets.filter((widget) => widget.id !== draggedWidget.id);

      for (const otherWidget of otherWidgets) {
        const otherPos = gridPositions.get(otherWidget.id);
        if (!otherPos) continue;

        const otherW = Math.min(otherWidget.w || 1, NUM_COLUMNS);
        const otherH = otherWidget.h || 1;

        // Check for rectangle overlap
        const overlap = !(newPosition.x + w <= otherPos.x || newPosition.x >= otherPos.x + otherW || newPosition.y + h <= otherPos.y || newPosition.y >= otherPos.y + otherH);

        if (overlap) {
          hasCollision = true;
          break;
        }
      }

      // Only update position if no collision
      if (!hasCollision) {
        const updatedWidgets = widgets.map((widget) => {
          if (widget.id === draggedWidget.id) {
            return {
              ...widget,
              x: newPosition.x,
              y: newPosition.y,
            };
          }
          return widget;
        });

        updateWidgets(updatedWidgets);
      }
    }
  };

  const availableWidgets = Object.values(WidgetType).filter((type) => !widgets.some((w) => w.type === type));

  // Calculate container height based on grid layout
  const containerHeight = React.useMemo(() => {
    let maxRow = 0;
    widgets.forEach((widget) => {
      const pos = gridPositions.get(widget.id);
      if (pos) {
        const bottomRow = pos.y + (widget.h || 1);
        maxRow = Math.max(maxRow, bottomRow);
      }
    });
    return maxRow * BASE_WIDGET_HEIGHT + GRID_PADDING * 2;
  }, [widgets, gridPositions]);

  return (
    <Box className="flex-1">
      {/* Add Widget Menu */}
      {showAddMenu && (
        <Box className={`border-b p-4 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <HStack className="mb-2 items-center justify-between">
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Widget</Text>
            <Pressable onPress={() => setShowAddMenu(false)} className="p-1">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Close</Text>
            </Pressable>
          </HStack>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="sm">
              {availableWidgets.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => handleAddWidget(type)}
                  className={`rounded px-4 py-2 ${isDark ? 'border border-gray-600 bg-gray-700' : 'border border-gray-300 bg-white'}`}
                  {...(Platform.OS === 'web' ? { 'data-testid': `add-widget-${type}` } : { testID: `add-widget-${type}` })}
                >
                  <Text className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{WIDGET_LABELS[type]}</Text>
                </Pressable>
              ))}
              {availableWidgets.length === 0 && <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>All widgets added</Text>}
            </HStack>
          </ScrollView>
        </Box>
      )}

      {/* Dashboard Grid */}
      <ScrollView className="flex-1">
        {widgets.length === 0 ? (
          <VStack space="md" className="flex-1 items-center justify-center p-8" style={{ minHeight: 300 }}>
            <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to Your Dashboard</Text>
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click the + button above to add widgets to your dashboard</Text>
          </VStack>
        ) : (
          <View style={[styles.gridContainer, { height: containerHeight }]}>
            {widgets.map((widget) => {
              const position = gridPositions.get(widget.id);
              if (!position) return null;

              return (
                <DraggableWidget
                  key={widget.id}
                  widget={widget}
                  position={position}
                  isEditMode={isEditMode}
                  isDragging={draggingId === widget.id}
                  onDragStart={() => setDraggingId(widget.id)}
                  onDragEnd={(newPos) => {
                    setDraggingId(null);
                    handleReorder(widget, newPos);
                  }}
                  onRemove={() => removeWidget(widget.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </Box>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    position: 'relative',
    width: '100%',
    padding: GRID_PADDING,
  },
  widgetContainer: {
    position: 'absolute',
    padding: 5,
  },
});
