import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { VoiceRoutingModule } from './widgets-routing.module';
import { reducer } from './reducers/widgets.reducer';
import { WidgetsEffects } from './effects/widgets.effect';
//import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { IonicModule } from '@ionic/angular';
import { HammerModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { CallsWidgetComponent } from './shared/calls/calls.component';
import { ClockWidgetComponent } from './shared/clock/clock.component';
import { LinksWidgetComponent } from './shared/links/links.component';
import { MapWidgetComponent } from './shared/map/map.component';
import { NotesWidgetComponent } from './shared/notes/notes.component';
import { PersonnelWidgetComponent } from './shared/personnel/personnel.component';
import { PTTWidgetComponent } from './shared/ptt/ptt.component';
import { UnitsWidgetComponent } from './shared/units/units.component';
import { WeatherWidgetComponent } from './shared/weather/weather.component';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
    declarations: [
        CallsWidgetComponent,
        ClockWidgetComponent,
        LinksWidgetComponent,
        MapWidgetComponent,
        NotesWidgetComponent,
        PersonnelWidgetComponent,
        PTTWidgetComponent,
        UnitsWidgetComponent,
        WeatherWidgetComponent
    ],
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        VoiceRoutingModule,
        StoreModule.forFeature('widgetsModule', reducer),
        EffectsModule.forFeature([WidgetsEffects]),
        HammerModule,
        PipesModule
    ],
    providers: [],
    exports: [
        CallsWidgetComponent,
        ClockWidgetComponent,
        LinksWidgetComponent,
        MapWidgetComponent,
        NotesWidgetComponent,
        PersonnelWidgetComponent,
        PTTWidgetComponent,
        UnitsWidgetComponent,
        WeatherWidgetComponent
    ]
})
export class WidgetsModule { }