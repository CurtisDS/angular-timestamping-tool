import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';

/** a class to represent a {@link value time split/timestamp}, its {@link label description}, and its {@link offsetSeconds offset} */
export class SavedTime {
  constructor(
    /** the timestamp of the split */
    public value: Moment,
    /** a description of the split */
    public label?: string,
    /** a number of seconds that will correct a mistimed split */
    public offsetSeconds?: number) {}

  /** get the time value after applying the adjustment of the {@link offsetSeconds offset} value */
  getAdjustedTime(): Moment {
    return this.value.clone().add(this.offsetSeconds||0, "seconds");
  }
}

/** a class to hold data for undo/redo */
class HistoryState {
  constructor(
    /** the list of times to save */
    public times: SavedTime[],
    /** the {@link TimestampState} to save */
    public runningState: TimestampState) {}
}

/** enum to keep track of the current running state */
export enum TimestampState {
  Stopped = 1,
  Running = 2
}

@Injectable({
  providedIn: 'root',
 })
export class TimesService {

  constructor() { }

  /** a list of {@link SavedTime time splits}*/
  private _times: SavedTime[] = [];
  state: TimestampState = TimestampState.Stopped;
 
  /**
   * a showel copy of the internal {@link _times} array which holds each split its description and offset.
   * Use accessory methods to modify the list
   * {@link addTime()},
   * {@link deleteTime()},
   * {@link deleteTimes()}
   */
  get times(): SavedTime[] {
    // create a showel copy so that this class is the only class that can add or remove items from the array
    return [...this._times];
  }

  /** the earliest time in the {@link times} list */
  get startTime(): SavedTime | undefined {
    if(this._times?.length>0)
      return this._times[0];
    return undefined;
  }

  /** the earliest time in the {@link times} list */
  get latestTime(): SavedTime | undefined {
    if(this._times?.length>0)
      return this._times[this._times.length-1];
    return undefined;
  }

  /**
   * compare a given time to the start time to get a difference represented by a UTC moment.
   * Given either a {@link SavedTime} or a {@link Moment} to compare to the {@link startTime start time}
   * @returns {Moment} the difference represented as a Moment
   */
  getDiff(time: SavedTime|Moment): Moment {
    let compare: Moment;
    if(time instanceof SavedTime) {
      compare = time.getAdjustedTime();
    } else {
      compare = time;
    }
    return moment.utc(compare.diff(this.startTime.getAdjustedTime()));
  }

  /** remove all time splits from the {@link times} list */
  deleteTimes() {
    this._times = [];
    this.historyCheckForChanges();
  }

  /** remove a time split at {@link index} from the {@link times} list */
  deleteTime(index:number) {
    this._times.splice(index, 1);
    this.historyCheckForChanges();
  }

  /** add a time split to the {@link times} list */
  addTime(time: SavedTime) {
    this._times.push(time);
    this.historyCheckForChanges();
  }

  /**
   * an index to keep track of where in the {@link undoHistory history} array we are.
   * initialized as -1, this will be increased to 0 as soon as the first history state is added
   */
  private undoHistoryIndex: number = -1;
  /** the list of all {@link HistoryState history states} serialized as strings with {@link JSON.stringify} */
  private undoHistory: string[] = []; // initialized as an empty array
  /** the maximum number of {@link HistoryState undo actions} will be saved before the oldest ones fall off */
  private maxHistoryCount = 100;

  /** a check flag to make sure the {@link historyCheckForChanges()} method doesnt get called more than once at a time */
  private checkForChangesIsRunning = false;
  /** a check flag to tell us that we need to rerun {@link historyCheckForChanges()} because a process called the method while it was still working on the previous check for change. */
  private checkForChangesNeedsReRun = false;

  /** 
   * attempts to look at the current state of the {@link times} list and determine if a change has been made
   * if a change is detected, that change will be added into the history list
   */
  historyCheckForChanges() {
    // look to see if we need to add a new state to the history state list
    // only check if we arent already running this check
    if(!this.checkForChangesIsRunning) {
      // block other attempts to check for changes
      this.checkForChangesIsRunning = true;
      // get the current state of the times array as a JSON object
      let currentState = JSON.stringify(new HistoryState(this._times, this.state));
      // if there is an existing history we need to check if the current state has changed
      if(this.undoHistory.length > 0) {
        // get the state of the saved history that we are currently on
        let lastState = this.undoHistory[this.undoHistoryIndex];
        // if the current state does not match the last saved state we need to add a new state to the history
        if(lastState!=currentState) {
          // add the new state to the history list
          this.addHistoryState(currentState);
        } else {
          // we are done this check, run the check to see if there was any calls to this method while it was running
          this.tryEndCheck();
        }
      } else {
        // there was no history so create one by adding the current state to the history list
        this.addHistoryState(currentState);
      }
    } else {
      // if a check was in process save the fact that we will have to check again once its finished
      this.checkForChangesNeedsReRun = true;
    }
  }

  /** check to see if we need to rerun {@link historyCheckForChanges()} */
  private tryEndCheck() {
    if(this.checkForChangesNeedsReRun) {
      this.historyCheckForChanges();
    } else {
      this.checkForChangesIsRunning = false;
    }
  }

  /** add a new stringified {@link HistoryState} to the {@link undoHistory} */
  private addHistoryState(state?: string) {
    // if state wasnt provided get the current state of the times array
    if(typeof state === "undefined") state = JSON.stringify(new HistoryState(this._times, this.state));
    // delete anything from the history array that is ahead of the current index
    this.undoHistory.length = this.undoHistoryIndex + 1;
    // if the history size is over the max remove the oldest state
    if(this.undoHistory.length > this.maxHistoryCount) {
      this.undoHistory.shift();
    }
    // push the current state to the history
    this.undoHistory.push(state);
    // update the current index of the history list
    this.undoHistoryIndex = this.undoHistory.length - 1;
    // try to finsih checking for changes
    this.tryEndCheck();
  }

  /** attempts to reassign class properties/methods to a given JSON object */
  private reviseFn = (key: any, value: any): any => {
    if ("" === key) {
      // dont need to change type
      return value;
    } else if (key == 'runningState') {
      // 'runningState' is an ENUM for state
      return TimestampState[TimestampState[value]];
    } else if (key == 'value') {
      // 'value' is a moment so recreate a moment object
      return moment(value);
    } else if (!isNaN(key) && value.hasOwnProperty('value')) {
      // if key is a number we are on an array item which needs to be assigned as a SavedTime object
      return Object.assign(new SavedTime(moment()), value);
    }
    // dont need to change type
    return value;
  };

  /** undo the last change */
  undoLastChange() {
    if(this.undoHistoryIndex > 0) {
      this.undoHistoryIndex--;
      // get json string from history
      let newState = this.undoHistory[this.undoHistoryIndex];
      // parse json string back into a SavedTime array
      let newStateObj:HistoryState = JSON.parse(newState, this.reviseFn);
      // replace the times list with the one taken out of the history list
      this._times = newStateObj.times;
      // replace the running state with the new running state
      this.state = newStateObj.runningState;
    }
  }

  /** redo the last change that had been undone if it still exists in the {@link undoHistory history} list */
  redoLastChange() {
    if(this.undoHistoryIndex < this.undoHistory.length - 1) {
      this.undoHistoryIndex++;
      // get json string from history
      let newState = this.undoHistory[this.undoHistoryIndex];
      // parse json string back into a SavedTime array
      let newStateObj = JSON.parse(newState, this.reviseFn);
      // replace the times list with the one taken out of the history list
      this._times = newStateObj.times;
      // replace the running state with the new running state
      this.state = newStateObj.runningState;
    }
  }
}