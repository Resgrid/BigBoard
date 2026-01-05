import { logger } from '@/lib/logging';

/**
 * CallKeep Service (iOS)
 * Handles iOS CallKit integration for VoIP calls
 */
export class CallKeepService {
  private static instance: CallKeepService;

  public static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService();
    }
    return CallKeepService.instance;
  }

  public async setup(): Promise<void> {
    logger.info({ message: 'CallKeep service setup (iOS)' });
  }

  public async displayIncomingCall(callId: string, handle: string): Promise<void> {
    logger.info({ message: 'Displaying incoming call', context: { callId, handle } });
  }

  public async endCall(callId: string): Promise<void> {
    logger.info({ message: 'Ending call', context: { callId } });
  }

  public async cleanup(): Promise<void> {
    logger.info({ message: 'Cleaning up CallKeep service' });
  }
}

export const callKeepService = CallKeepService.getInstance();
