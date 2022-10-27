import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import moment=require('moment');

export class SavedTime {
  constructor(public value: Moment,
    public label?: string,
    public offsetSeconds?: number) {}

  getAdjustedTime(): Moment {
    return this.value.clone().add(this.offsetSeconds||0, "seconds");
  }
}

class HistoryState {
  constructor(public times: SavedTime[], public runningState: TimestampState) {}
}

export enum TimestampState {
  Stopped = 1,
  Running = 2
}

@Injectable({
  providedIn: 'root',
 })
export class TimesService {

  constructor() { }

  private _times: SavedTime[] = [];
  state: TimestampState = TimestampState.Stopped;
 
  /**
   * a showel copy of the internal times array.
   * Use accessory methods to modify the list
   * {@link addTime()},
   * {@link deleteTime()},
   * {@link deleteTimes()}
   * */
  get times() {
    return [...this._times];
  }

  get startTime() {
    if(this._times?.length>0)
      return this._times[0];
    return undefined;
  }

  get latestTime() {
    if(this._times?.length>0)
      return this._times[this._times.length-1];
    return undefined;
  }

  getDiff(time: SavedTime|Moment) {
    let compare: Moment;
    if(time instanceof SavedTime) {
      compare = time.getAdjustedTime();
    } else {
      compare = time;
    }
    return moment.utc(compare.diff(this.startTime.getAdjustedTime()));
  }

  deleteTimes() {
    this._times = [];
    this.historyCheckForChanges();
  }

  deleteTime(index:number) {
    this._times.splice(index, 1);
    this.historyCheckForChanges();
  }

  addTime(time: SavedTime) {
    this._times.push(time);
    this.historyCheckForChanges();
  }

  private undoHistoryIndex: number = -1;
  private undoHistory: string[] = [];
  private maxHistoryCount = 100;

  private checkForChangesIsRunning = false;
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
          console.log("lastState!=currentState");
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

  /**
   * check to see if there is any waiting calls to {@link historyCheckForChanges()}
   */
  private tryEndCheck() {
    if(this.checkForChangesNeedsReRun) {
      this.historyCheckForChanges();
    } else {
      this.checkForChangesIsRunning = false;
    }
  }

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
    console.log("add undo", this.undoHistory);
    // try to finsih checking for changes
    this.tryEndCheck();
  }

  /** 
   * attempts to reassign a JSON object to a class object during a parse
   */
  private reviseFn = (key: any, value: any) => {
    if ("" === key) {
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
    return value;
  };

  undoLastChange() {
    if(this.undoHistoryIndex > 0) {
      this.undoHistoryIndex--;
      // get json string from history
      let newState = this.undoHistory[this.undoHistoryIndex];
      // parse json string back into a SavedTime array
      let newStateObj:HistoryState = JSON.parse(newState, this.reviseFn);
      console.log("do undo", newStateObj, this._times);
      // replace the times list with the one taken out of the history list
      this._times = newStateObj.times;
      // replace the running state with the new running state
      this.state = newStateObj.runningState;
    }
  }

  redoLastChange() {
    if(this.undoHistoryIndex < this.undoHistory.length - 1) {
      this.undoHistoryIndex++;
      // get json string from history
      let newState = this.undoHistory[this.undoHistoryIndex];
      // parse json string back into a SavedTime array
      let newStateObj = JSON.parse(newState, this.reviseFn);
      console.log("do redo", newStateObj, this._times);
      // replace the times list with the one taken out of the history list
      this._times = newStateObj.times;
      // replace the running state with the new running state
      this.state = newStateObj.runningState;
    }
  }
}