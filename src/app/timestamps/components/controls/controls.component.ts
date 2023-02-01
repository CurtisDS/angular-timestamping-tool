import { Component, OnInit, OnDestroy, HostListener, Input, HostBinding } from '@angular/core';
import { SavedTime, TimesService, TimestampState } from '../../services/times.service';
import { SortState, ViewState, ViewStateService } from '../../services/view-state.service';
import { YoutubeService } from '../../services/youtube.service';
import moment from 'moment';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit, OnDestroy {
  constructor(private timeservice: TimesService, private viewstateservice: ViewStateService, private youtube: YoutubeService) {}

  /** the heading to use in this component */
  @Input() name: string;

  /** a date string for the main timestamp display (MMM DD HH:mm:ss) */
  dateString: string;
  /** a time string for the main timestamp disaply (HH:mm:ss) */
  timeString: string;
  /** a timer to update the {@link dateString} and {@link timeString} and save history occasionally */
  interval: any;

  /** a value which will be compared to {@link historyInterval} to determin if enough cycles of the {@link interval timer} have passed in order to tigger the history update */
  historyIntervalTrigger = 10;
  /** only trigger a history update in the {@link interval timer} every {@link historyIntervalTrigger X} number of cycles  */
  historyInterval = 0;

  /** track if the shortcut panel is open */
  showInfo = false;

  /** current ui state is importing old timestamps */
  importing = false;
  @HostBinding('style.flex') get flexStyle(): string {
    return this.importing ? '1 0 auto' : null;
  }
  importChapters = ""

  ngOnInit() {
    // initialize the timestring to zeros
    this.timeString = '00:00:00';
    // initialize the datestring to now
    this.dateString = moment().format('MMM DD HH:mm:ss');

    // create the timer to run ever 0.1 seconds
    this.interval = setInterval(() => {
      if (this.timeservice.times?.length > 0) {
        // if there are splits and the current state is Running update the time and date strings
        if(this.timeservice.state == TimestampState.Running) {
          let now = moment();
          let dif = this.timeservice.getDiff(now);
          this.timeString = dif.format('HH:mm:ss');
          this.dateString = now.format('MMM DD HH:mm:ss');
        }
      } else {
        // there are no splits, reinitialize the time and date strings
        this.timeString = '00:00:00';
        this.dateString = moment().format('MMM DD HH:mm:ss');
      }
      // increase the history interval
      this.historyInterval++;
      // if we pass the tigger amount run the check for changes, it would be too much to check every 0.1s so only check ever X number of cycles
      if(this.historyInterval > this.historyIntervalTrigger) {
        // reset the interval
        this.historyInterval = 0;
        // trigger the timeservice to check for state changes
        this.timeservice.historyCheckForChanges();
      }
    }, 100);
  }

  ngOnDestroy() {
    // delete the timer
    clearInterval(this.interval);
  }

  /** is the current {@link ViewState} equal to {@link ViewState.Code} */
  get isCodeViewState(): boolean {
    return this.viewstateservice.state === ViewState.Code;
  }

  /** is the current {@link SortState} equal to {@link SortState.Chron} */
  get isChronological(): boolean {
    return this.viewstateservice.sort === SortState.Chron;
  }

  /** is the current {@link TimestampState} equal to {@link TimestampState.Running} */
  get isRunning(): boolean {
    return this.timeservice.state === TimestampState.Running;
  }

  /** the current size of the times array */
  get timestampsSize(): number {
    return this.timeservice.times?.length || 0;
  }

  /** get the youtube url from the youtube service */
  get youtubeURL(): string {
    return this.youtube.URL;
  }

  /** set the youtube url in the youtube service */
  set youtubeURL(val: string) {
    this.youtube.URL = val;
  }

  /** get the youtube panel view setting */
  get showYTPanel(): boolean {
    return this.youtube.showYTPanel;
  }

  /** set the youtube panel view setting */
  set showYTPanel(val: boolean) {
    this.youtube.showYTPanel = val;
  }

  /** event listener for when CTRL+Z is pressed to perform an undo */
  @HostListener('window:keydown.control.z', ['$event'])
  undo(event: KeyboardEvent) {
    this.timeservice.undoLastChange();
  }

  /** event listener for when either CTRL+SHIFT+Z or CTRL+Y is pressed to perform a redo */
  @HostListener('window:keydown.shift.control.z', ['$event'])
  @HostListener('window:keydown.control.y', ['$event'])
  redo(event: KeyboardEvent) {
    this.timeservice.redoLastChange();
  }

  /** event listener for when Numpad+ is pressed to perform a split */
  @HostListener('window:keydown.+', ['$event'])
  splitShortcut(event: KeyboardEvent) {
    // only do the split if the state is currently running
    if(this.isRunning) {
      // get the current focus target in the DOM
      const el = document.activeElement;
      // get the tag name of that DOM element
      let tagname = el.tagName.toLocaleLowerCase();

      // if the tag is an input, check to see if its a type that would expect text input before performing a split
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
            // the element was an input tag but not one expecting text input so its safe to do a split
            event.preventDefault();
            this.split();
            return;
        }
      } else if(tagname != "input") {
        // the element was not an input so do the split
        event.preventDefault();
        this.split();
      }
    }
  }

  /** set the state to running and create a new split to indicate the change in state */
  play() {
    // remove any unimported chapters and turn off importing mode
    this.importChapters = "";
    this.importing = false;
    // set new state
    this.timeservice.state = TimestampState.Running;
    if (this.timeservice.times?.length === 0) {
      this.timeservice.addTime(new SavedTime(moment(), 'Start'));
    } else {
      this.timeservice.addTime(new SavedTime(moment(), 'Unpaused'));
    }
  }

  /** set the state to stopped and create a split to indicate the change in state */
  stop() {
    this.timeservice.state = TimestampState.Stopped;
    this.timeservice.addTime(new SavedTime(moment(), 'Paused'));
  }

  /** create a new split */
  split() {
    this.timeservice.addTime(new SavedTime(moment()));
  }

  /** delete all splits */
  delete() {
    if (this.timeservice.times?.length > 0) {
      // ask for a confirmation before deleting
      var result = confirm("Are you sure you want to delete all timestamps?");
      if (result) {
        this.showInfo = false;
        this.youtube.showYTPanel = false;
        this.youtubeURL = "";
        // delete the times
        this.timeservice.deleteTimes();
      }
    }
  }

  /** set the current {@link ViewState} to {@link ViewState.Code} */
  codeView() {
    this.viewstateservice.updateViewState(ViewState.Code);
  }

  /** set the current {@link ViewState} to {@link ViewState.Edit} */
  editView() {
    this.viewstateservice.updateViewState(ViewState.Edit);
  }

  /** set the current {@link SortState} to {@link SortState.Chron} */
  sortChron() {
    this.viewstateservice.updateSortState(SortState.Chron);
  }

  /** set the current {@link SortState} to {@link SortState.RevChron} */
  sortRevChron() {
    this.viewstateservice.updateSortState(SortState.RevChron);
  }

  /** Function to convert a timecode in the format "HH:mm:ss" to a number of seconds */
  timecodeToSeconds(timecode: string) {
    // Split the timecode into hours, minutes, and seconds
    const [hours, minutes, seconds] = timecode.split(':').map(Number);
    // Convert the hours, minutes, and seconds to a timestamp in seconds
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  /** flip between import state and not, if it was import state, then parse the contents of the textarea for timestamps */
  import() {
    if(!this.importing) {
      this.importChapters = "";
      this.importing = true;
    } else {
      this.importing = false;
      if(this.importChapters.trim() != "") {
        // split based on new lines
        const list = this.importChapters.trim().replace("\r", "").split("\n").map((line) => {
          let result = line.split(" - ");
          // convert to an object { time, label } and turn HH:mm:ss to seconds
          return { time: this.timecodeToSeconds(result[0].trim()), label: result.slice(1).join(" - ").trim() };
        });

        // sort chronologically
        list.sort((a, b) => {
          return a.time - b.time;
        });

        // get the last timestamp seconds
        const maxTime = list[list.length - 1].time;
        const now = moment();
        list.forEach(item => {
          // Assuming the last timestamp happened "now" get the difference in seconds to each timestamp to get when the timestamp would have been generated
          const secondsOffset = maxTime - item.time;
          const momentTime = now.clone().subtract(secondsOffset, "seconds");
          this.timeservice.addTime(new SavedTime(momentTime, item.label));
        });
      }
    }
  }
}
