import { getItem, setItem } from './index';

const PERSONNEL_FILTERS_KEY = 'personnel_selected_filters';

export async function savePersonnelFilterOptions(filterIds: string[]): Promise<void> {
  await setItem(PERSONNEL_FILTERS_KEY, filterIds);
}

export function loadPersonnelFilterOptions(): string[] {
  const filters = getItem<string[]>(PERSONNEL_FILTERS_KEY);
  return filters ?? [];
}
