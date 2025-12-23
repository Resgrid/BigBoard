import React from 'react';

import { Switch } from '../ui/switch';
import { Text } from '../ui/text';
import { View } from '../ui/view';
interface ToggleItemProps {
  text: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  textStyle?: string;
}

export const ToggleItem: React.FC<ToggleItemProps> = ({ text, value, onValueChange, disabled = false, icon, textStyle }) => {
  return (
    <View className="flex-1 flex-row items-center justify-between px-4 py-2">
      <View className="flex-row items-center">
        {icon && <View className="pr-2">{icon}</View>}
        <Text className={`${textStyle}`}>{text}</Text>
      </View>
      <View className="flex-row items-center">
        <Switch size="md" value={value} onValueChange={onValueChange} isDisabled={disabled} />
      </View>
    </View>
  );
};
