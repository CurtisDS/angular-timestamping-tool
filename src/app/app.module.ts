import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { TimestampComponent } from './components/timestamp/timestamp.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialModule } from '../material.module';
import { ControlsComponent } from './components/controls/controls.component';
import { ConvertCaseDirective } from './directives/convert-case.directive';

import { YouTubePlayerModule } from '@angular/youtube-player';
import { DraggableDirective } from './directives/dargable-div.directive';

@NgModule({
  imports: [ 
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    MaterialModule,
    ReactiveFormsModule,
    YouTubePlayerModule ],
  declarations: [ AppComponent, TimestampComponent, SpinnerComponent, ControlsComponent, ConvertCaseDirective, DraggableDirective ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
