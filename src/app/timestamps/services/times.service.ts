import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';
import { ImportService } from './import.service';

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

  constructor(private importservice:ImportService) {
    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // check local storage to see if there was a previous view state and use that if it exists
      if (localStorage.lastTimeStampHistoryState) {
        // parse json string back into a HistoryState and use its values as current state
        this.parseAndInitFromState(localStorage.lastTimeStampHistoryState);
      }
    }
  }

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

  /** the latest time in the {@link times} list */
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
    let compare = time instanceof SavedTime ? time.getAdjustedTime() : time;
    return moment.utc(compare.diff(this.startTime.getAdjustedTime()));
  }

  /**
   * compare a given time to the start time to get a difference in seconds.
   * Given either a {@link SavedTime} or a {@link Moment} to compare to the {@link startTime start time}
   * @returns {number} the difference in seconds
   */
  getDiffSeconds(time: SavedTime|Moment): number {
    let compare = time instanceof SavedTime ? time.getAdjustedTime() : time;
    return compare.diff(this.startTime.getAdjustedTime(), 'seconds');
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
   * Shift a SavedTime's value and offset in opposite directions so that
   * its adjusted time (value + offset) remains unchanged.
   *
   * The shift is always applied in whole seconds so that offsetSeconds
   * remains an integer.
   *
   * @param t The SavedTime to modify
   * @param deltaSeconds Number of seconds to shift the value (must be integer)
   */
  private shiftValueKeepAdjusted(t: SavedTime, deltaSeconds: number) {
    if (!deltaSeconds) return;

    t.value = t.value.clone().add(deltaSeconds, "seconds");
    t.offsetSeconds = (t.offsetSeconds || 0) - deltaSeconds;
  }

  /**
   * Clamp a SavedTime's value between two adjusted-time bounds while keeping
   * its adjusted time constant.
   *
   * This ensures the value→adjusted correction interval does not cross
   * neighboring adjusted times.
   *
   * Bounds are inclusive, allowing zero spacing between adjusted times.
   *
   * @param t The SavedTime to clamp
   * @param minBound The earliest allowed value (usually previous adjusted time)
   * @param maxBound The latest allowed value (usually next adjusted time)
   */
  private clampValueKeepAdjusted(
    t: SavedTime,
    minBound?: Moment,
    maxBound?: Moment
  ) {
    const currentValue = t.value;
    let targetValue = currentValue;

    if (minBound && targetValue.isBefore(minBound)) {
      targetValue = minBound;
    }

    if (maxBound && targetValue.isAfter(maxBound)) {
      targetValue = maxBound;
    }

    if (!targetValue.isSame(currentValue)) {
      // integer delta only
      const deltaSeconds = targetValue.diff(currentValue, "seconds");
      this.shiftValueKeepAdjusted(t, deltaSeconds);
    }
  }

  /**
   * Repair a SavedTime at the given index so that its correction interval
   * does not overlap the adjusted times of its immediate neighbors.
   *
   * The adjusted time of the SavedTime is preserved.
   *
   * @param index Index of the SavedTime to repair
   */
  private repairIndex(index: number) {
    const t = this._times[index];
    if (!t) return;

    const prevAdjusted =
      index > 0 ? this._times[index - 1].getAdjustedTime() : undefined;

    const nextAdjusted =
      index + 1 < this._times.length
        ? this._times[index + 1].getAdjustedTime()
        : undefined;

    this.clampValueKeepAdjusted(t, prevAdjusted, nextAdjusted);
  }

  /**
   * Insert a new {@link SavedTime} into the {@link times} list based on a relative number of seconds from the
   * {@link startTime start time}.
   *
   * The new SavedTime:
   * - is inserted in chronological order by adjusted time
   * - defaults to have no offsetSeconds
   *
   * After insertion, neighboring SavedTimes are repaired so that:
   * - adjusted times never change
   * - no correction interval overlaps another adjusted time
   *
   * @param seconds Seconds after the {@link startTime start time} for the new split
   * @param label Optional label for the split
   * @param offset Optional offset for the split
   */
  insertTime(seconds: number, label?: string, offset?: number) {
    if (typeof seconds === "undefined" || seconds == null) return;
  
    const value = this.startTime
      .getAdjustedTime()
      .clone()
      .add(seconds, "seconds");
  
    const newTime = new SavedTime(value, label, offset);
    const newAdjusted = newTime.getAdjustedTime();
  
    let insertIndex = this._times.findIndex(t =>
      newAdjusted.isBefore(t.getAdjustedTime())
    );
  
    if (insertIndex === -1) {
      insertIndex = this._times.length;
    }
  
    this._times.splice(insertIndex, 0, newTime);
  
    // Repair neighbors around the insertion point
    this.repairIndex(insertIndex - 1);
    this.repairIndex(insertIndex + 1);
  
    // Optional extra safety for cascading edge cases
    this.repairIndex(insertIndex - 2);
    this.repairIndex(insertIndex + 2);
  
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
    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // save the stringified history state to local storage so the next time the page loads we wont lose our splits
      localStorage.setItem("lastTimeStampHistoryState", state as any);
    }
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
    if(this.undoHistoryIndex > 0 && this.importservice.cancelImport()) {
      this.undoHistoryIndex--;
      // get json string from history
      let newState = this.undoHistory[this.undoHistoryIndex];
      // parse json string back into a HistoryState and use its values as current state
      this.parseAndInitFromState(newState);
    }
  }

  /** redo the last change that had been undone if it still exists in the {@link undoHistory history} list */
  redoLastChange() {
    if(this.undoHistoryIndex < this.undoHistory.length - 1) {
      this.undoHistoryIndex++;
      // get json string from history
      let newState = this.undoHistory[this.undoHistoryIndex];
      // parse json string back into a HistoryState and use its values as current state
      this.parseAndInitFromState(newState);
    }
  }

  /** parse the stringifies {@link HistoryState} and use its contents to replace the current {@link times} and {@link state} */
  parseAndInitFromState(newState: string) {
    // parse json string back into a HistoryState
    let newStateObj: HistoryState = JSON.parse(newState, this.reviseFn);
    // replace the times list with the one taken out of the history list
    this._times = newStateObj.times;
    // replace the running state with the new running state
    this.state = newStateObj.runningState;
  }
}