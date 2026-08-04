import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { getAllGroups } from '@/api/groups/groups';
import { getRecipients } from '@/api/messaging/messages';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type RecipientsResultData } from '@/models/v4/messages/recipientsResultData';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useUnitsStore } from '@/stores/units/store';
import { type ScheduledCallsWidgetSettings } from '@/stores/widget-settings/scheduled-calls-settings-store';

interface FilterOption {
  id: string;
  label: string;
}

interface EntityMultiSelectProps {
  label: string;
  options: FilterOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  isDark: boolean;
}

// Above this many options we require a search query before rendering the full
// list, so a large personnel roster doesn't render hundreds of chips at once.
const MAX_INLINE_OPTIONS = 30;

const EntityMultiSelect: React.FC<EntityMultiSelectProps> = ({ label, options, selectedIds, onChange, isDark }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const trimmedQuery = query.trim().toLowerCase();

  const visibleOptions = useMemo(() => {
    if (trimmedQuery) {
      return options.filter((option) => option.label.toLowerCase().includes(trimmedQuery) || selectedIds.includes(option.id));
    }
    if (options.length <= MAX_INLINE_OPTIONS) {
      return options;
    }
    // Large list with no query: only show what's already selected.
    return options.filter((option) => selectedIds.includes(option.id));
  }, [options, trimmedQuery, selectedIds]);

  const showSearch = options.length > 8;
  const isTruncated = !trimmedQuery && options.length > MAX_INLINE_OPTIONS;

  return (
    <VStack space="sm">
      <HStack className="items-center justify-between">
        <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</Text>
        {selectedIds.length > 0 ? (
          <Pressable onPress={() => onChange([])} hitSlop={8}>
            <Text className="text-xs font-medium text-blue-500">{t('configure.filter_clear', { count: selectedIds.length })}</Text>
          </Pressable>
        ) : null}
      </HStack>

      {options.length === 0 ? (
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('configure.filter_none')}</Text>
      ) : (
        <>
          {showSearch ? (
            <Input variant="outline" size="sm">
              <InputField placeholder={t('configure.filter_search')} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} />
            </Input>
          ) : null}

          <Box className="flex-row flex-wrap">
            {visibleOptions.map((option) => {
              const selected = selectedIds.includes(option.id);
              return (
                <Pressable key={option.id} onPress={() => toggle(option.id)} className="mb-2 mr-2">
                  <Box className={`rounded-full border px-3 py-1 ${selected ? 'border-blue-500 bg-blue-500' : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'}`}>
                    <Text className={`text-xs ${selected ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'}`}>{option.label}</Text>
                  </Box>
                </Pressable>
              );
            })}
          </Box>

          {isTruncated ? <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('configure.filter_search_hint', { count: options.length })}</Text> : null}
        </>
      )}
    </VStack>
  );
};

interface ScheduledCallsFilterSectionProps {
  settings: ScheduledCallsWidgetSettings;
  onUpdate: (updates: Partial<ScheduledCallsWidgetSettings>) => void;
  isDark: boolean;
}

/**
 * Filtering controls for the Scheduled Calls widget. Loads the same master data
 * the widget uses to resolve dispatched entities (groups, units, personnel,
 * roles) and lets the user pick which of them a scheduled call must include to
 * be shown. Selections are written to the widget's `filter*Ids` settings, which
 * the widget matches against each call's dispatched entities.
 */
export const ScheduledCallsFilterSection: React.FC<ScheduledCallsFilterSectionProps> = ({ settings, onUpdate, isDark }) => {
  const { t } = useTranslation();
  const { personnel, init: initPersonnel } = usePersonnelStore();
  const { units, fetchUnits } = useUnitsStore();
  const [groups, setGroups] = useState<GroupResultData[]>([]);
  const [roles, setRoles] = useState<RecipientsResultData[]>([]);

  useEffect(() => {
    initPersonnel();
    fetchUnits();

    getAllGroups()
      .then((res) => setGroups(res.Data || []))
      .catch(() => setGroups([]));

    getRecipients(false, false)
      .then((res) => setRoles((res.Data || []).filter((recipient) => recipient.Type === 'Role')))
      .catch(() => setRoles([]));
  }, [initPersonnel, fetchUnits]);

  const groupOptions = useMemo<FilterOption[]>(() => groups.map((group) => ({ id: group.GroupId, label: group.Name })), [groups]);
  const unitOptions = useMemo<FilterOption[]>(() => units.map((unit) => ({ id: unit.UnitId, label: unit.Name })), [units]);
  const personnelOptions = useMemo<FilterOption[]>(() => personnel.map((person) => ({ id: person.UserId, label: `${person.FirstName} ${person.LastName}`.trim() || person.UserId })), [personnel]);
  const roleOptions = useMemo<FilterOption[]>(() => roles.map((role) => ({ id: role.Id, label: role.Name })), [roles]);

  return (
    <VStack space="md">
      <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('configure.filtering')}</Text>
      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('configure.filter_help_select')}</Text>

      <EntityMultiSelect label={t('configure.filter_groups')} options={groupOptions} selectedIds={settings.filterGroupIds} onChange={(ids) => onUpdate({ filterGroupIds: ids })} isDark={isDark} />
      <EntityMultiSelect label={t('configure.filter_units')} options={unitOptions} selectedIds={settings.filterUnitIds} onChange={(ids) => onUpdate({ filterUnitIds: ids })} isDark={isDark} />
      <EntityMultiSelect label={t('configure.filter_personnel')} options={personnelOptions} selectedIds={settings.filterPersonnelIds} onChange={(ids) => onUpdate({ filterPersonnelIds: ids })} isDark={isDark} />
      <EntityMultiSelect label={t('configure.filter_roles')} options={roleOptions} selectedIds={settings.filterRoleIds} onChange={(ids) => onUpdate({ filterRoleIds: ids })} isDark={isDark} />
    </VStack>
  );
};
