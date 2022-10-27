import { Injectable } from '@angular/core';

export enum ViewState {
  Edit = 1,
  Code = 2
}

export enum SortState {
  Chron = 1,
  RevChron = 2
}

@Injectable({
  providedIn: 'root',
 })
export class ViewStateService {

  constructor() { 
    this._viewstate = ViewState.Edit;
    this._sortstate = SortState.RevChron;

    if (typeof(Storage) !== "undefined") {
      if (localStorage.lastTimeStampViewState)
        this._viewstate = ViewState[ViewState[localStorage.lastTimeStampViewState]];

      if (localStorage.lastTimeStampSortState)
        this._sortstate = ViewState[ViewState[localStorage.lastTimeStampSortState]];
    }
  }

  private _viewstate: ViewState;
  private _sortstate: SortState;

  get state(): ViewState {
    return this._viewstate;
  }

  get sort(): SortState {
    return this._sortstate;
  }

  updateViewState(state: ViewState) {
    this._viewstate = state;
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("lastTimeStampViewState", this._viewstate as any);
    }
  }

  updateSortState(state: SortState) {
    this._sortstate = state;
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("lastTimeStampSortState", this._sortstate as any);
    }
  }
}