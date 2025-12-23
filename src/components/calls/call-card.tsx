import { AlertTriangle, MapPin, Phone } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { getTimeAgoUtc, invertColor } from '@/lib/utils';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import type { CallResultData } from '@/models/v4/calls/callResultData';

function getColor(call: CallResultData, priority: CallPriorityResultData | undefined) {
  if (!call) {
    return '#808080';
  } else if (call.CallId === '0') {
    return '#808080';
  } else if (priority && priority.Color) {
    return priority.Color;
  }

  return '#808080';
}

interface CallCardProps {
  call: CallResultData;
  priority: CallPriorityResultData | undefined;
}

export const CallCard: React.FC<CallCardProps> = ({ call, priority }) => {
  const textColor = invertColor(getColor(call, priority), true);

  return (
    <Box
      style={{
        backgroundColor: getColor(call, priority),
      }}
      className={`mb-2 rounded-xl p-2 shadow-sm`}
    >
      {/* Header with Call Number and Priority */}
      <HStack className="mb-4 items-center justify-between">
        <HStack className="items-center space-x-2">
          <AlertTriangle size={20} />
          <Text
            style={{
              color: textColor,
            }}
            className={`text-lg font-bold`}
          >
            #{call.Number}
          </Text>
        </HStack>
        <Text
          style={{
            color: textColor,
          }}
          className="text-sm text-gray-600"
        >
          {getTimeAgoUtc(call.LoggedOnUtc)}
        </Text>
      </HStack>

      {/* Call Details */}
      <VStack className="space-y-3">
        {/* Name */}
        <HStack className="items-center space-x-2">
          <Icon as={Phone} className="text-gray-500" size="md" />
          <Text
            style={{
              color: textColor,
            }}
            className="font-medium text-gray-900"
          >
            {call.Name}
          </Text>
        </HStack>

        {/* Address */}
        <HStack className="items-center space-x-2">
          <Icon as={MapPin} className="text-gray-500" size="md" />
          <Text
            style={{
              color: textColor,
            }}
            className="text-gray-700"
          >
            {call.Address}
          </Text>
        </HStack>

        {/* Dispatched Time */}
        {/* Disabling this for now, ideally a list of disptched items would be ideal here but there is a perf issue getting that data. -SJ
        <HStack className="items-center space-x-2">
          <Icon as={Calendar} className="text-gray-500" size="md" />
          <Text className="text-sm text-gray-600">Dispatched: {format(new Date(call.DispatchedOn), 'PPp')}</Text>
        </HStack>*/}
      </VStack>

      {/* Nature of Call */}
      {call.Nature && (
        <Box className="mt-4 rounded-lg bg-white/50 p-3">
          <WebView
            style={[styles.container, { height: 80 }]}
            originWhitelist={['*']}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                    <style>
                      body {
                        color: ${textColor};
                        font-family: system-ui, -apple-system, sans-serif;
                        margin: 0;
                        padding: 0;
                        font-size: 16px;
                        line-height: 1.5;
                      }
                      * {
                        max-width: 100%;
                      }
                    </style>
                  </head>
                  <body>${call.Nature}</body>
                </html>
              `,
            }}
            androidLayerType="software"
          />
        </Box>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
