import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
 })
export class YoutubeService {
  constructor() {}

  private _URL = "";

  get URL(): string {
    return this._URL;
  }
  set URL(val: string) {
    this._URL = val;
  }

  showYTPanel = false;

  private _hidePIP = true;

  get hidePIP(): boolean {
    return this._hidePIP;
  }
  set hidePIP(val: boolean) {
    this._hidePIP = val;
    if(val) {
      this.seekTo(null);
    }
  }

  private _seekToSubject = new Subject<number>();
  get seekToObservable(): Observable<number> {
      return this._seekToSubject.asObservable();
  }

  seekTo(time: number) {
    this._seekToSubject.next(time);
  }
}