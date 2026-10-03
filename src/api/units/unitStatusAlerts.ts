import { type GetUnitStatusAlertAcknowledgementsResult } from '@/models/v4/unitStatusAlerts/getUnitStatusAlertAcknowledgementsResult';
import { type SaveUnitStatusAlertAcknowledgementResult } from '@/models/v4/unitStatusAlerts/saveUnitStatusAlertAcknowledgementResult';
import { type UnitStatusAlertAcknowledgedLevel, type UnitStatusAlertAcknowledgementMode } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';

import { createApiEndpoint } from '../common/client';

// Not cached: an acknowledgement a colleague made a second ago must show on every board.
const getActiveAcknowledgementsApi = createApiEndpoint('/UnitStatusAlerts/GetActiveAcknowledgements');
const acknowledgeApi = createApiEndpoint('/UnitStatusAlerts/Acknowledge');

export interface AcknowledgeUnitStatusAlertRequest {
  unitId: string;
  /** The unit's CurrentUnitStateId as the board saw it. */
  unitStateId: number;
  /** The level the board is showing. */
  level: UnitStatusAlertAcknowledgedLevel;
  mode: UnitStatusAlertAcknowledgementMode;
  /** For a mute: minutes to mute for, 0 for until the unit changes status. */
  muteMinutes: number;
  note?: string;
}

export const getActiveUnitStatusAlertAcknowledgements = async () => {
  const response = await getActiveAcknowledgementsApi.get<GetUnitStatusAlertAcknowledgementsResult>();
  return response.data;
};

export const acknowledgeUnitStatusAlert = async (request: AcknowledgeUnitStatusAlertRequest) => {
  const response = await acknowledgeApi.post<SaveUnitStatusAlertAcknowledgementResult>({
    UnitId: parseInt(request.unitId, 10),
    UnitStateId: request.unitStateId,
    Level: request.level,
    Mode: request.mode,
    MuteMinutes: request.muteMinutes,
    Note: request.note ?? '',
  });
  return response.data;
};

export const clearUnitStatusAlertAcknowledgement = async (acknowledgementId: string) => {
  const response = await createApiEndpoint(`/UnitStatusAlerts/Clear/${encodeURIComponent(acknowledgementId)}`).delete<SaveUnitStatusAlertAcknowledgementResult>();
  return response.data;
};
