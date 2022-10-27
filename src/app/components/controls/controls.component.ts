import { Component, OnInit, OnDestroy, HostListener, Input } from '@angular/core';
import { SavedTime, TimesService, TimestampState } from '../../services/times.service';
import { SortState, ViewState, ViewStateService } from '../../services/view-state.service';
import moment from 'moment';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit, OnDestroy {
  constructor(private timeservice: TimesService, private viewstateservice: ViewStateService) {}

  /** the heading to use in this component */
  @Input() name: string;

  dateString: string;
  timeString: string;
  interval: number;

  historyIntervalTrigger = 10;
  historyInterval = 0;

  ngOnInit() {
    this.timeString = '00:00:00';
    this.dateString = moment().format('MMM DD HH:mm:ss');

    this.interval = setInterval(() => {
      if (this.timeservice.times?.length > 0) {
        if(this.timeservice.state == TimestampState.Running) {
          let now = moment();
          let dif = this.timeservice.getDiff(now);
          this.timeString = dif.format('HH:mm:ss');
          this.dateString = now.format('MMM DD HH:mm:ss');
        }
      } else {
        this.timeString = '00:00:00';
        this.dateString = moment().format('MMM DD HH:mm:ss');
      }
      this.historyInterval++;
      if(this.historyInterval > this.historyIntervalTrigger) {
        this.historyInterval = 0;
        this.timeservice.historyCheckForChanges();
      }
    }, 100);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  get isCodeViewState():boolean {
    return this.viewstateservice.state === ViewState.Code;
  }

  get isChronological():boolean {
    return this.viewstateservice.sort === SortState.Chron;
  }

  get isRunning() {
    return this.timeservice.state === TimestampState.Running;
  }

  get timestampsSize() {
    return this.timeservice.times?.length || 0;
  }

  @HostListener('window:keydown.control.z', ['$event'])
  undo(event: KeyboardEvent) {
    this.timeservice.undoLastChange();
  }

  @HostListener('window:keydown.shift.control.z', ['$event'])
  @HostListener('window:keydown.control.y', ['$event'])
  redo(event: KeyboardEvent) {
    this.timeservice.redoLastChange();
  }

  @HostListener('window:keydown.+', ['$event'])
  splitShortcut(event: KeyboardEvent) {
    const el = document.activeElement;
    let tagname = el.tagName.toLocaleLowerCase();

    if(tagname == "input" && el.hasAttribute("type")) {
      let type = el.getAttribute("type").toLocaleLowerCase();
      switch(type) {
        case "button":
        case "checkbox":
        case "color":
        case "file":
        case "hidden":
        case "image":
        case "radio":
        case "range":
        case "reset":
        case "submit":
          return;
      }
    } else if(tagname != "input") {
      event.preventDefault();
      if(this.isRunning) {
        this.split();
      }
    }
  }

  play() {
    this.timeservice.state = TimestampState.Running;
    if (this.timeservice.times?.length === 0) {
      this.timeservice.addTime(new SavedTime(moment(), 'Start'));
    } else {
      this.timeservice.addTime(new SavedTime(moment(), 'Unpaused'));
    }
  }

  stop() {
    this.timeservice.state = TimestampState.Stopped;
    this.timeservice.addTime(new SavedTime(moment(), 'Paused'));
  }

  split() {
    this.timeservice.addTime(new SavedTime(moment()));
  }

  delete() {
    if (this.timeservice.times?.length > 0) {
      var result = confirm("Are you sure you want to delete all timestamps?");
      if (result) {
        this.timeservice.deleteTimes();
        this.timeString = '00:00:00';
      }
    }
  }

  codeView() {
    this.viewstateservice.updateViewState(ViewState.Code);
  }

  editView() {
    this.viewstateservice.updateViewState(ViewState.Edit);
  }

  sortChron() {
    this.viewstateservice.updateSortState(SortState.Chron);
  }

  sortRevChron() {
    this.viewstateservice.updateSortState(SortState.RevChron);
  }
}
