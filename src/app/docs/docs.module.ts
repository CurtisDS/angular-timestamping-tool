import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DocsComponent } from './docs.component';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialModule } from '../../material.module';
import { ControlsComponent } from './components/controls/controls.component';
import { TopicComponent } from './components/topic/topic.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [ 
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    MaterialModule,
    ReactiveFormsModule,
    SharedModule ],
  declarations: [ DocsComponent, TopicComponent, ControlsComponent ],
  exports: [
    DocsComponent
  ]
})
export class DocsModule { }
