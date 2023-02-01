import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialModule } from '../../material.module';
import { TimestampsComponent } from './timestamps.component';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { TimestampComponent } from './components/timestamp/timestamp.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ControlsComponent } from './components/controls/controls.component';
import { DraggableDirective } from './directives/dargable-div.directive';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    MaterialModule,
    ReactiveFormsModule,
    YouTubePlayerModule,
    SharedModule
  ],
  declarations: [
    TimestampComponent, SpinnerComponent, ControlsComponent, DraggableDirective, TimestampsComponent
  ],
  exports: [
    TimestampsComponent
  ]
})
export class TimestampsModule { }