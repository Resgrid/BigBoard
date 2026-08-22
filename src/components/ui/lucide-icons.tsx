import {
  AlertCircle as RawAlertCircle,
  ArrowLeft as RawArrowLeft,
  BellIcon as RawBellIcon,
  Box as RawBox,
  BuildingIcon as RawBuildingIcon,
  Calendar as RawCalendar,
  CalendarIcon as RawCalendarIcon,
  CheckCircle as RawCheckCircle,
  CheckIcon as RawCheckIcon,
  ChevronDownIcon as RawChevronDownIcon,
  ChevronRight as RawChevronRight,
  ChevronRightIcon as RawChevronRightIcon,
  Circle as RawCircle,
  Clock as RawClock,
  Edit2Icon as RawEdit2Icon,
  EditIcon as RawEditIcon,
  ExternalLink as RawExternalLink,
  GlobeIcon as RawGlobeIcon,
  HomeIcon as RawHomeIcon,
  Loader2 as RawLoader2,
  type LucideProps,
  Mail as RawMail,
  MailIcon as RawMailIcon,
  MapPinIcon as RawMapPinIcon,
  MoreVertical as RawMoreVertical,
  MoreVerticalIcon as RawMoreVerticalIcon,
  PhoneIcon as RawPhoneIcon,
  PlusIcon as RawPlusIcon,
  SearchIcon as RawSearchIcon,
  SettingsIcon as RawSettingsIcon,
  SmartphoneIcon as RawSmartphoneIcon,
  StarIcon as RawStarIcon,
  Tag as RawTag,
  Trash2 as RawTrash2,
  TrashIcon as RawTrashIcon,
  UserIcon as RawUserIcon,
  UsersIcon as RawUsersIcon,
  X as RawX,
  XIcon as RawXIcon,
} from 'lucide-react-native';
import { styled } from 'nativewind';
import type React from 'react';

/**
 * lucide icons that understand `className`.
 *
 * nativewind v5 dropped the JSX transform: a `className` only has an effect on a component
 * that has been through `styled()`, and metro's polyfill only covers `react-native` itself.
 * On a raw lucide icon the class was silently discarded -- which is why `text-*` colours and
 * `mr-*` spacing had no effect and icons rendered with their default near-black stroke.
 *
 * `target: 'style'` keeps layout utilities working, and `nativeStyleMapping` lifts the
 * resolved colour out of the style object onto lucide's `color` prop, which is where
 * react-native-svg resolves `currentColor` from.
 *
 * Only icons used with a className live here, so the bundle is unchanged; import the rest
 * straight from `lucide-react-native`.
 */
const iconMapping = {
  className: {
    target: 'style',
    nativeStyleMapping: {
      color: 'color',
    },
  },
} as const;

type LucideIcon = React.ComponentType<LucideProps>;

const themed = <T extends LucideIcon>(Component: T): T => styled(Component as LucideIcon, iconMapping) as unknown as T;

export const AlertCircle = themed(RawAlertCircle);
export const ArrowLeft = themed(RawArrowLeft);
export const BellIcon = themed(RawBellIcon);
export const Box = themed(RawBox);
export const BuildingIcon = themed(RawBuildingIcon);
export const Calendar = themed(RawCalendar);
export const CalendarIcon = themed(RawCalendarIcon);
export const CheckCircle = themed(RawCheckCircle);
export const CheckIcon = themed(RawCheckIcon);
export const ChevronDownIcon = themed(RawChevronDownIcon);
export const ChevronRight = themed(RawChevronRight);
export const ChevronRightIcon = themed(RawChevronRightIcon);
export const Circle = themed(RawCircle);
export const Clock = themed(RawClock);
export const Edit2Icon = themed(RawEdit2Icon);
export const EditIcon = themed(RawEditIcon);
export const ExternalLink = themed(RawExternalLink);
export const GlobeIcon = themed(RawGlobeIcon);
export const HomeIcon = themed(RawHomeIcon);
export const Loader2 = themed(RawLoader2);
export const Mail = themed(RawMail);
export const MailIcon = themed(RawMailIcon);
export const MapPinIcon = themed(RawMapPinIcon);
export const MoreVertical = themed(RawMoreVertical);
export const MoreVerticalIcon = themed(RawMoreVerticalIcon);
export const PhoneIcon = themed(RawPhoneIcon);
export const PlusIcon = themed(RawPlusIcon);
export const SearchIcon = themed(RawSearchIcon);
export const SettingsIcon = themed(RawSettingsIcon);
export const SmartphoneIcon = themed(RawSmartphoneIcon);
export const StarIcon = themed(RawStarIcon);
export const Tag = themed(RawTag);
export const Trash2 = themed(RawTrash2);
export const TrashIcon = themed(RawTrashIcon);
export const UserIcon = themed(RawUserIcon);
export const UsersIcon = themed(RawUsersIcon);
export const X = themed(RawX);
export const XIcon = themed(RawXIcon);
