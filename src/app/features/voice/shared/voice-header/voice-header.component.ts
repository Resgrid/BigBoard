import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { DepartmentVoiceChannelResultData } from '@resgrid/ngx-resgridlib';
import { Observable, Subscription } from 'rxjs';
import { AudioProvider } from 'src/app/providers/audio';
import { OpenViduService } from 'src/app/providers/openvidu';
import { selectAvailableChannelsState, selectVoiceState } from 'src/app/store';
import * as VoiceActions from '../../actions/voice.actions';
import { VoiceState } from '../../store/voice.store';

@Component({
  selector: 'app-voice-header',
  templateUrl: './voice-header.component.html',
  styleUrls: ['./voice-header.component.scss'],
})
export class VoiceFooterComponent implements OnInit, OnDestroy {
  public selectedChannel: DepartmentVoiceChannelResultData;
  public isTransmitting: boolean = false;
  public voiceState$: Observable<VoiceState | null>;

  private participants: number = 0;
  private voiceSubscription: Subscription | null;

  constructor(
    private store: Store<VoiceState>,
    public openViduService: OpenViduService,
    private audioProvider: AudioProvider,
    private ref: ChangeDetectorRef
  ) {
    this.voiceState$ = this.store.select(selectVoiceState);
  }
  
  ngOnInit(): void {
    this.voiceSubscription = this.voiceState$.subscribe((state) => {
      if (state) {
        if (state.currentActiveVoipChannel) {
          this.selectedChannel = state.currentActiveVoipChannel;
        } else if (state.channels) {
          this.selectedChannel = state.channels[0];
        }

        this.isTransmitting = state.isTransmitting;

        if (this.participants !== state.participants) {
          this.ref.detectChanges();
          this.participants = state.participants;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.voiceSubscription) {
      this.voiceSubscription.unsubscribe();
      this.voiceSubscription = null;
    }
  }

  public toggleTransmitting() {
    if (this.isTransmitting) {
      this.stopTransmitting();
    } else {
      this.startTransmitting();
    }
  }

  public startTransmitting(): void {
    if (this.selectedChannel.Id !== '') {
      this.audioProvider.playTransmitStart();
      this.store.dispatch(new VoiceActions.StartTransmitting());
    }
  }

  public stopTransmitting(): void {
    if (this.selectedChannel.Id !== '') {
      this.store.dispatch(new VoiceActions.StopTransmitting());
      this.audioProvider.playTransmitEnd();
    }
  }

  public onChannelChange(channel) {
    if (this.isTransmitting) {
      this.stopTransmitting();
    }

    if (channel.Id === '') {
      this.store.dispatch(new VoiceActions.SetNoChannel());
    } else {
      this.store.dispatch(new VoiceActions.SetActiveChannel(channel));
    }
  }
}
