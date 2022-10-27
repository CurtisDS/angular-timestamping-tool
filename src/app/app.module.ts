import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { TimestampComponent } from './components/timestamp/timestamp.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialExampleModule } from '../material.module';
import { ControlsComponent } from './components/controls/controls.component';

@NgModule({
  imports:      [ 
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    MaterialExampleModule,
    ReactiveFormsModule ],
  declarations: [ AppComponent, HelloComponent, TimestampComponent, SpinnerComponent, ControlsComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
