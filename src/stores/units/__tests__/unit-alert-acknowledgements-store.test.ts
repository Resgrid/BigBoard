import { AxiosError, type AxiosResponse } from 'axios';

import { acknowledgeUnitStatusAlert, clearUnitStatusAlertAcknowledgement, getActiveUnitStatusAlertAcknowledgements } from '@/api/units/unitStatusAlerts';
import { UnitStatusAlertAcknowledgedLevel, UnitStatusAlertAcknowledgementMode, UnitStatusAlertAcknowledgementResultData } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';

import { useUnitsStore } from '../store';
import { useUnitAlertAcknowledgementsStore } from '../unit-alert-acknowledgements-store';

jest.mock('@/api/units/unitStatusAlerts');
jest.mock('@/lib/logging', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));
jest.mock('../store', () => {
  const fetchUnits = jest.fn();
  return { useUnitsStore: { getState: () => ({ fetchUnits }) } };
});

const mockGet = getActiveUnitStatusAlertAcknowledgements as jest.MockedFunction<typeof getActiveUnitStatusAlertAcknowledgements>;
const mockAcknowledge = acknowledgeUnitStatusAlert as jest.MockedFunction<typeof acknowledgeUnitStatusAlert>;
const mockClear = clearUnitStatusAlertAcknowledgement as jest.MockedFunction<typeof clearUnitStatusAlertAcknowledgement>;

const row = (overrides: Partial<UnitStatusAlertAcknowledgementResultData> = {}): UnitStatusAlertAcknowledgementResultData =>
  Object.assign(new UnitStatusAlertAcknowledgementResultData(), { UnitStatusAlertAcknowledgementId: 'a1', UnitId: '12', UnitStateId: 77, ...overrides });

/** What axios throws for a 4xx carrying the server's refusal body. */
const refusal = (status: number, body: object) => {
  const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST');
  error.response = { status, data: body, statusText: '', headers: {}, config: {} } as AxiosResponse;
  return error;
};

const request = {
  unitId: '12',
  unitStateId: 77,
  level: UnitStatusAlertAcknowledgedLevel.Warn,
  mode: UnitStatusAlertAcknowledgementMode.Acknowledged,
  muteMinutes: 0,
  note: 'MUG not departed, technical malfunction reported.',
};

describe('useUnitAlertAcknowledgementsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUnitAlertAcknowledgementsStore.setState({ acknowledgements: {}, isLoading: false, error: null });
  });

  it('keys the fetched acknowledgements by unit', async () => {
    mockGet.mockResolvedValue({ Data: [row(), row({ UnitStatusAlertAcknowledgementId: 'a2', UnitId: '13' })] } as never);

    await useUnitAlertAcknowledgementsStore.getState().fetchAcknowledgements();

    expect(Object.keys(useUnitAlertAcknowledgementsStore.getState().acknowledgements).sort()).toEqual(['12', '13']);
  });

  it('keeps what it was showing when a refresh fails, so a handled alert does not come back', async () => {
    useUnitAlertAcknowledgementsStore.setState({ acknowledgements: { '12': row() } });
    mockGet.mockRejectedValue(new Error('offline'));

    await useUnitAlertAcknowledgementsStore.getState().fetchAcknowledgements();

    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']).toBeDefined();
    expect(useUnitAlertAcknowledgementsStore.getState().error).not.toBeNull();
  });

  it('does not let a refresh that started before a save wipe the saved acknowledgement', async () => {
    let resolveStale: (value: never) => void = () => undefined;
    mockGet.mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve))).mockResolvedValueOnce({ Data: [row({ Note: request.note })] } as never);
    mockAcknowledge.mockResolvedValue({ Data: row({ Note: request.note }), Error: null } as never);

    const fetching = useUnitAlertAcknowledgementsStore.getState().fetchAcknowledgements();
    await useUnitAlertAcknowledgementsStore.getState().acknowledge(request);
    resolveStale({ Data: [] } as never);
    await fetching;

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']?.Note).toBe(request.note);
    expect(useUnitAlertAcknowledgementsStore.getState().isLoading).toBe(false);
  });

  it('does not let a refresh that started before a clear bring the cleared acknowledgement back', async () => {
    useUnitAlertAcknowledgementsStore.setState({ acknowledgements: { '12': row() } });
    let resolveStale: (value: never) => void = () => undefined;
    mockGet.mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve))).mockResolvedValueOnce({ Data: [] } as never);
    mockClear.mockResolvedValue({ Data: row({ ClearedOnUtc: '2026-10-02T12:00:00.000Z' }), Error: null } as never);

    const fetching = useUnitAlertAcknowledgementsStore.getState().fetchAcknowledgements();
    await useUnitAlertAcknowledgementsStore.getState().clear(row());
    resolveStale({ Data: [row()] } as never);
    await fetching;

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']).toBeUndefined();
  });

  it('shows a saved acknowledgement straight away', async () => {
    mockAcknowledge.mockResolvedValue({ Data: row({ Note: request.note }), Error: null } as never);

    const outcome = await useUnitAlertAcknowledgementsStore.getState().acknowledge(request);

    expect(outcome).toEqual({ ok: true });
    expect(mockAcknowledge).toHaveBeenCalledWith(request);
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']?.Note).toBe(request.note);
  });

  it('shows the colleague acknowledgement that won a race', async () => {
    mockAcknowledge.mockRejectedValue(refusal(409, { Error: 'unit_alert_conflict', Data: row({ UnitStatusAlertAcknowledgementId: 'theirs', AcknowledgedByName: 'Matt Casey' }) }));

    const outcome = await useUnitAlertAcknowledgementsStore.getState().acknowledge(request);

    expect(outcome).toEqual({ ok: false, error: 'unit_alert_conflict' });
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']?.UnitStatusAlertAcknowledgementId).toBe('theirs');
  });

  it.each(['unit_alert_status_changed', 'unit_alert_not_overdue'])('catches up with the unit when the server says %s', async (code) => {
    useUnitAlertAcknowledgementsStore.setState({ acknowledgements: { '12': row() } });
    mockAcknowledge.mockRejectedValue(refusal(409, { Error: code, Data: null }));

    const outcome = await useUnitAlertAcknowledgementsStore.getState().acknowledge(request);

    expect(outcome).toEqual({ ok: false, error: code });
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']).toBeUndefined();
    expect(useUnitsStore.getState().fetchUnits).toHaveBeenCalled();
  });

  it('reports a failure it cannot read as unknown', async () => {
    mockAcknowledge.mockRejectedValue(new Error('network down'));

    const outcome = await useUnitAlertAcknowledgementsStore.getState().acknowledge(request);

    expect(outcome).toEqual({ ok: false, error: 'unknown' });
  });

  it('removes a cleared acknowledgement', async () => {
    useUnitAlertAcknowledgementsStore.setState({ acknowledgements: { '12': row() } });
    mockClear.mockResolvedValue({ Data: row({ ClearedOnUtc: '2026-10-02T12:00:00.000Z' }), Error: null } as never);

    const outcome = await useUnitAlertAcknowledgementsStore.getState().clear(row());

    expect(outcome).toEqual({ ok: true });
    expect(mockClear).toHaveBeenCalledWith('a1');
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']).toBeUndefined();
  });

  it('treats clearing one that is already gone as done', async () => {
    useUnitAlertAcknowledgementsStore.setState({ acknowledgements: { '12': row() } });
    mockClear.mockRejectedValue(refusal(404, { Error: 'unit_alert_not_found', Data: null }));

    const outcome = await useUnitAlertAcknowledgementsStore.getState().clear(row());

    expect(outcome).toEqual({ ok: true });
    expect(useUnitAlertAcknowledgementsStore.getState().acknowledgements['12']).toBeUndefined();
  });
});
