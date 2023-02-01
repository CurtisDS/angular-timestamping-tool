import { Component, OnInit, Input } from '@angular/core';
import { LineObj, StartChars, ViewState, ViewStateService } from '../../services/view-state.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit {
  constructor(public viewstateservice: ViewStateService) {}

  /** the heading to use in this component */
  @Input() name: string;

  showInfo = false;

  ngOnInit() {
  }

  /** is the current {@link ViewState} equal to {@link ViewState.Code} */
  get isCodeViewState(): boolean {
    return this.viewstateservice.state === ViewState.Code;
  }

  /** set the current {@link ViewState} to {@link ViewState.Code} and convert the docArray to docString */
  codeView() {
    // convert Doc array to Doc string
    this.viewstateservice.updateDocString();
    // update the state
    this.viewstateservice.updateViewState(ViewState.Code);
  }

  /** set the current {@link ViewState} to {@link ViewState.Edit} and convert the docString to docArray */
  editView() {
    if(this.viewstateservice.docString.trim() != "") {
      // generate the doc array
      this.viewstateservice.generateDocArray()
      // update the state
      this.viewstateservice.updateViewState(ViewState.Edit);
    } else {
      // delete data but dont change state since there is no docString
      this.viewstateservice.clearDoc();
    }
  }
}
