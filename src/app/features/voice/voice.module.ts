import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { VoiceRoutingModule } from './voice-routing.module';
import { reducer } from './reducers/voice.reducer';
import { VoiceEffects } from './effects/voice.effect';
//import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { VoiceFooterComponent } from './shared/voice-header/voice-header.component';
import { IonicModule } from '@ionic/angular';
import { OpenViduVideoComponent } from './shared/video-component/ov-video.component';
import { UserVideoComponent } from './shared/video-component/user-video.component';
import { HammerModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';

@NgModule({
    declarations: [
        VoiceFooterComponent,
        UserVideoComponent,
        OpenViduVideoComponent
    ],
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        VoiceRoutingModule,
        StoreModule.forFeature('voiceModule', reducer),
        EffectsModule.forFeature([VoiceEffects]),
        HammerModule
    ],
    providers: [],
    exports: [
        VoiceFooterComponent,
        UserVideoComponent,
        OpenViduVideoComponent
    ]
})
export class VoiceModule { }
