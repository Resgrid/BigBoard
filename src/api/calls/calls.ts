import { type ActiveCallsResult } from '@/models/v4/calls/activeCallsResult';
import { type CallExtraDataResult } from '@/models/v4/calls/callExtraDataResult';
import { type CallResult } from '@/models/v4/calls/callResult';
import { type SaveCallResult } from '@/models/v4/calls/saveCallResult';

import { createApiEndpoint } from '../common/client';

const callsApi = createApiEndpoint('/Calls/GetActiveCalls');
const getCallApi = createApiEndpoint('/Calls/GetCall');
const getCallExtraDataApi = createApiEndpoint('/Calls/GetCallExtraData');
const createCallApi = createApiEndpoint('/Calls/SaveCall');
const updateCallApi = createApiEndpoint('/Calls/UpdateCall');
const closeCallApi = createApiEndpoint('/Calls/CloseCall');

export const getCalls = async () => {
  const response = await callsApi.get<ActiveCallsResult>();
  return response.data;
};

export const getCallExtraData = async (callId: string) => {
  const response = await getCallExtraDataApi.get<CallExtraDataResult>({
    callId: encodeURIComponent(callId),
  });
  return response.data;
};

export const getCall = async (callId: string) => {
  const response = await getCallApi.get<CallResult>({
    callId: encodeURIComponent(callId),
  });
  return response.data;
};

export interface CreateCallRequest {
  name: string;
  nature: string;
  note?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  priority: number;
  type?: string;
  contactName?: string;
  contactInfo?: string;
  what3words?: string;
  plusCode?: string;
  dispatchUsers?: string[];
  dispatchGroups?: string[];
  dispatchRoles?: string[];
  dispatchUnits?: string[];
  dispatchEveryone?: boolean;
}

export interface UpdateCallRequest {
  callId: string;
  name: string;
  nature: string;
  note?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  priority: number;
  type?: string;
  contactName?: string;
  contactInfo?: string;
  what3words?: string;
  plusCode?: string;
  dispatchUsers?: string[];
  dispatchGroups?: string[];
  dispatchRoles?: string[];
  dispatchUnits?: string[];
  dispatchEveryone?: boolean;
}

export interface CloseCallRequest {
  callId: string;
  type: number;
  note?: string;
}

export const createCall = async (callData: CreateCallRequest) => {
  let dispatchList = '';

  if (callData.dispatchEveryone) {
    dispatchList = '0';
  } else {
    const dispatchEntries: string[] = [];

    if (callData.dispatchUsers) {
      //dispatchEntries.push(...callData.dispatchUsers.map((user) => `U:${user}`));
      dispatchEntries.push(...callData.dispatchUsers);
    }
    if (callData.dispatchGroups) {
      //dispatchEntries.push(...callData.dispatchGroups.map((group) => `G:${group}`));
      dispatchEntries.push(...callData.dispatchGroups);
    }
    if (callData.dispatchRoles) {
      //dispatchEntries.push(...callData.dispatchRoles.map((role) => `R:${role}`));
      dispatchEntries.push(...callData.dispatchRoles);
    }
    if (callData.dispatchUnits) {
      //dispatchEntries.push(...callData.dispatchUnits.map((unit) => `U:${unit}`));
      dispatchEntries.push(...callData.dispatchUnits);
    }

    dispatchList = dispatchEntries.join('|');
  }

  const data = {
    Name: callData.name,
    Nature: callData.nature,
    Note: callData.note || '',
    Address: callData.address || '',
    Geolocation: `${callData.latitude?.toString() || ''},${callData.longitude?.toString() || ''}`,
    Priority: callData.priority,
    Type: callData.type || '',
    ContactName: callData.contactName || '',
    ContactInfo: callData.contactInfo || '',
    What3Words: callData.what3words || '',
    PlusCode: callData.plusCode || '',
    DispatchList: dispatchList,
  };

  const response = await createCallApi.post<SaveCallResult>(data);
  return response.data;
};

export const updateCall = async (callData: UpdateCallRequest) => {
  let dispatchList = '';

  if (callData.dispatchEveryone) {
    dispatchList = '0';
  } else {
    const dispatchEntries: string[] = [];

    if (callData.dispatchUsers) {
      //dispatchEntries.push(...callData.dispatchUsers.map((user) => `U:${user}`));
      dispatchEntries.push(...callData.dispatchUsers);
    }
    if (callData.dispatchGroups) {
      //dispatchEntries.push(...callData.dispatchGroups.map((group) => `G:${group}`));
      dispatchEntries.push(...callData.dispatchGroups);
    }
    if (callData.dispatchRoles) {
      //dispatchEntries.push(...callData.dispatchRoles.map((role) => `R:${role}`));
      dispatchEntries.push(...callData.dispatchRoles);
    }
    if (callData.dispatchUnits) {
      //dispatchEntries.push(...callData.dispatchUnits.map((unit) => `U:${unit}`));
      dispatchEntries.push(...callData.dispatchUnits);
    }

    dispatchList = dispatchEntries.join('|');
  }

  const data = {
    CallId: callData.callId,
    Name: callData.name,
    Nature: callData.nature,
    Note: callData.note || '',
    Address: callData.address || '',
    Geolocation: `${callData.latitude?.toString() || ''},${callData.longitude?.toString() || ''}`,
    Priority: callData.priority,
    Type: callData.type || '',
    ContactName: callData.contactName || '',
    ContactInfo: callData.contactInfo || '',
    What3Words: callData.what3words || '',
    PlusCode: callData.plusCode || '',
    DispatchList: dispatchList,
  };

  const response = await updateCallApi.post<SaveCallResult>(data);
  return response.data;
};

export const closeCall = async (callData: CloseCallRequest) => {
  const data = {
    Id: callData.callId,
    Type: callData.type,
    Notes: callData.note || '',
  };

  const response = await closeCallApi.put<SaveCallResult>(data);
  return response.data;
};
