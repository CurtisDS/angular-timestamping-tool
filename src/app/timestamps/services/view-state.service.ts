import { Injectable } from '@angular/core';

export enum ViewState {
  Edit = 1,
  Code = 2
}

export enum SortState {
  /** Chronological */
  Chron = 1,
  /** Reverse Chronological */
  RevChron = 2
}

@Injectable({
  providedIn: 'root',
 })
export class ViewStateService {

  private _viewstate: ViewState;
  private _sortstate: SortState;

  constructor() { 
    // initialize the default view state and sort state
    this._viewstate = ViewState.Edit;
    this._sortstate = SortState.RevChron;

    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
       // check local storage to see if there was a previous view state and use that if it exists
      if (localStorage.lastTimeStampViewState)
        this._viewstate = ViewState[ViewState[localStorage.lastTimeStampViewState]];
      // check local storage to see if there was a previous sort state and use that if it exists
      if (localStorage.lastTimeStampSortState)
        this._sortstate = ViewState[ViewState[localStorage.lastTimeStampSortState]];
    }
  }

  /** the current {@link ViewState} */
  get state(): ViewState {
    return this._viewstate;
  }

  /** the current {@link SortState} */
  get sort(): SortState {
    return this._sortstate;
  }

  /** update the current {@link ViewState} to a new state */
  updateViewState(state: ViewState) {
    // update the local copy of the view state
    this._viewstate = state;
    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // save the view state in local storage so the next time the page loads the setting will be consistant
      localStorage.setItem("lastTimeStampViewState", this._viewstate as any);
    }
  }

  /** update the current {@link SortState} to a new state */
  updateSortState(state: SortState) {
    // update the local copy of the sort state
    this._sortstate = state;
    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // save the sort state in local storage so the next time the page loads the setting will be consistant
      localStorage.setItem("lastTimeStampSortState", this._sortstate as any);
    }
  }
}