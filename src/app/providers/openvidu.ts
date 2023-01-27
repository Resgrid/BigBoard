import { ApplicationRef, Injectable } from '@angular/core';
import {
  ConnectionEvent,
  Device,
  OpenVidu,
  Publisher,
  PublisherSpeakingEvent,
  Session,
  SessionDisconnectedEvent,
  StreamEvent,
  StreamManager,
  Subscriber,
} from 'openvidu-browser';
import {
  DepartmentVoiceChannelResultData,
  VoiceService,
  VoiceSessionConnectionResult,
  VoiceSessionConnectionResultData,
} from '@resgrid/ngx-resgridlib';
import { VoiceState } from '../features/voice/store/voice.store';
import { Store } from '@ngrx/store';
import * as VoiceActions from '../features/voice/actions/voice.actions';
import { BehaviorSubject, concat, from, Observable, of, Subscription } from 'rxjs';
import { concatMap, delay, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AudioUser } from '../models/audioUser';
import { Platform, ToastController } from '@ionic/angular';
import { OpenViduDevicesService } from './openviduDevices';
import { SettingsState } from '../features/settings/store/settings.store';
import { selectIsAppActive } from '../store';

declare var cordova: any;

@Injectable({
  providedIn: 'root',
})
export class OpenViduService {
  private connectedName: string;
  private channel: DepartmentVoiceChannelResultData;
  // OpenVidu objects
  private OV: OpenVidu | undefined;
  private session: Session | undefined;
  //publisher: StreamManager; // Local
  private publisher: Publisher | undefined; // Local
  private isConnectionLost: boolean = false;
  public subscribers: StreamManager[] = []; // Remotes
  private isAppActiveSub: Subscription | null = null;
  private audioSource: string | undefined = undefined;

  constructor(
    private store: Store<VoiceState>,
    private settingsStore: Store<SettingsState>,
    private voiceService: VoiceService,
    private toastController: ToastController,
    private devicesService: OpenViduDevicesService,
    private platform: Platform
  ) {
    if (!this.isAppActiveSub || this.isAppActiveSub.closed) {
      this.isAppActiveSub = this.settingsStore.select(selectIsAppActive).subscribe(data => {
        if (typeof data !== 'undefined') {
          if (!data) {
            this.swtichMicrophone();
          }
        }
      });
    }
  }

  public joinChannel(
    channel: DepartmentVoiceChannelResultData,
    name: string
  ): Observable<any> {
    this.OV = new OpenVidu();
    this.session = this.OV.initSession();
    this.connectedName = name;
    this.channel = channel;

    this.wireUpEventHandlers();

    if (environment.production) {
      this.OV.enableProdMode();
    }

    return this.voiceService.connectToSession(channel.Id).pipe(
      concatMap(async (data) => {
        if (data.Data && data.Data.Token && data.Status === 'success') {
          return this.session?.connect(data.Data.Token, { clientData: name });
        }

        return of(data);
      }),
      concatMap(async (data) => {
        return this.devicesService.initDevices();
      }),
      concatMap(async (data) => {
        return of(data).pipe(delay(2000));
      }),
      concatMap(async (data) => {
        return this.initPublisher();
      })
    );
  }

  public async initPublisher() {
    const audioDeviceAvailable = this.devicesService.hasAudioDeviceAvailable();
    const selectedMic = this.devicesService.getMicSelected();

    if (audioDeviceAvailable && selectedMic) {
      this.audioSource = selectedMic?.device;
    }

    // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
    // element: we will manage it on our own) and with the desired properties
    const publisher: Publisher = await this.OV!.initPublisherAsync('' /*undefined*/, {
      audioSource: this.audioSource,//undefined,//audioSource, //this.audioInputDeviceId, // The source of audio. If undefined default microphone
      videoSource: false, // The source of video. If undefined default webcam
      publishAudio: false, // Whether you want to start publishing with your audio unmuted or not
      publishVideo: false, // Whether you want to start publishing with your video enabled or not
      resolution: '640x480', // The resolution of your video
      frameRate: 1, // The frame rate of your video
      insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
      mirror: false, // Whether to mirror your local video or not
    });

    // --- 6) Publish your stream ---

    await this.session?.publish(publisher); //.then(() => {
    this.publisher = publisher;

    if (this.platform.is('ios')) {
      try {
        if (cordova && cordova.plugins && cordova.plugins.iosrtc) {
          cordova.plugins.iosrtc.turnOnSpeaker(true);
          cordova.plugins.iosrtc.selectAudioOutput('speaker');
        }
      } catch (err) {
        console.error(JSON.stringify(err));
      }
    }
  }

  public leaveSession() {
    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

    if (this.session) {
      this.session.disconnect();
    }

    // Empty all properties...
    this.subscribers = [];
    delete this.publisher;
    delete this.session;
    delete this.OV;
    //this.generateParticipantInfo();

    this.store.dispatch(new VoiceActions.SetCurrentVoiceState('Disconnected'));
  }

  public mute() {
    this.publisher?.publishAudio(false);
  }

  public unmute() {
    if (this.publisher) {
      this.publisher.publishAudio(true);
    }
  }

  private swtichMicrophone() {
    if (this.publisher && this.session)
    {
      this.mute();
      this.session.disconnect();
      this.subscribers = [];
      delete this.publisher;
      delete this.session;
      delete this.OV;

      this.joinChannel(this.channel, this.connectedName).subscribe(data => {
      });
    }
  }

  private deleteSubscriber(streamManager: StreamManager): void {
    const index = this.subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }

    this.store.dispatch(new VoiceActions.DecrementParticipants());
  }

  private isMyOwnConnection(connectionId: string): boolean {
    return this.session?.connection?.connectionId === connectionId;
  }

  private wireUpEventHandlers() {
    this.subscribeToReconnection();
    this.subscribeToConnectionCreatedAndDestroyed();

    // On every new Stream received...
    this.session?.on('streamCreated', (event: any /*StreamEvent*/) => {
      const properties = {
        subscribeToAudio: true,
        subscribeToVideo: false,
      };

      //if (this.subscribers.length === 0) {
      // This should be the first, and thus the connecting users stream.
      //  properties.subscribeToAudio = false;
      //}

      // Subscribe to the Stream to receive it. Second parameter is undefined
      // so OpenVidu doesn't create an HTML video on its own
      const subscriber: Subscriber = this.session!.subscribe(
        event.stream,
        '',//undefined,
        properties
      );

      this.subscribers.push(subscriber);
      //this.applicationRef.tick();

      this.store.dispatch(new VoiceActions.IncrementParticipants());
    });

    // On every Stream destroyed...
    this.session?.on('streamDestroyed', (event: any /*StreamEvent*/) => {
      // Remove the stream from 'subscribers' array
      this.deleteSubscriber(event.stream.streamManager);
    });

    // On every asynchronous exception...
    this.session?.on('exception', (exception) => {
      console.warn(exception);
    });

    this.session?.on(
      'publisherStartSpeaking',
      (event: any /*PublisherSpeakingEvent*/) => {
        if (
          event &&
          event.connection &&
          event.connection.localOptions &&
          event.connection.localOptions.metadata
        ) {
          let metadata = JSON.parse(event.connection.localOptions.metadata);

          console.log('Publisher ' + metadata.clientData + ' start speaking');
        } else {
          console.log(
            'Publisher ' + event.connection.connectionId + ' start speaking'
          );
        }
      }
    );

    this.session?.on(
      'publisherStopSpeaking',
      (event: any /*PublisherSpeakingEvent*/) => {
        console.log(
          'Publisher ' + event.connection.connectionId + ' stop speaking'
        );
      }
    );
  }

  private subscribeToReconnection() {
    this.session?.on('reconnecting', async () => {
      console.log('Connection lost: Reconnecting');
      this.isConnectionLost = true;

      const toast = await this.toastController.create({
        message: 'Connection Problem: Trying to reconnect to the session ...',
        duration: 3000,
      });
      toast.present();
    });
    this.session?.on('reconnected', () => {
      console.log('Connection lost: Reconnected');
      this.isConnectionLost = false;
    });
    this.session?.on(
      'sessionDisconnected',
      async (event: any /*SessionDisconnectedEvent*/) => {
        if (event.reason === 'networkDisconnect') {
          const toast = await this.toastController.create({
            message:
              'Unable to connect to the session due to an network problem',
            duration: 5000,
          });
          toast.present();

          this.leaveSession();
        }
      }
    );
  }

  private subscribeToConnectionCreatedAndDestroyed() {
    this.session?.on('connectionCreated', async (event: any /*ConnectionEvent*/) => {
      if (this.isMyOwnConnection(event.connection.connectionId)) {
        this.store.dispatch(new VoiceActions.SetCurrentVoiceState('Connected'));

        if (this.channel) {
          const toast = await this.toastController.create({
            message: 'Connected to channel ' + this.channel.Name,
            duration: 3000,
          });
          toast.present();
        }
      }

      //const nickname: string = this.utilsSrv.getNicknameFromConnectionData(
      //  event.connection.data
      //);
      //this.remoteUsersService.addUserName(event);

      // Adding participant when connection is created
      //if (!nickname?.includes('_' + VideoType.SCREEN)) {
      //  this.remoteUsersService.add(event, null);
      //  this.openViduWebRTCService.sendNicknameSignal(event.connection);
      //}
    });

    this.session?.on('connectionDestroyed', (event: any /*ConnectionEvent*/) => {
      if (this.isMyOwnConnection(event.connection.connectionId)) {
        return;
      }

      //this.remoteUsersService.deleteUserName(event);
      //const nickname: string = this.utilsSrv.getNicknameFromConnectionData(
      //  event.connection.data
      //);
      // Deleting participant when connection is destroyed
      //if (!nickname?.includes('_' + VideoType.SCREEN)) {
      //  this.remoteUsersService.removeUserByConnectionId(
      //    event.connection.connectionId
      //  );
      //}
    });
  }
}
