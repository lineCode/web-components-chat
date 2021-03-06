import Dexie from 'dexie';
import { defer, from, Observable } from 'rxjs';
import { distinctUntilChanged, flatMap, map, mapTo, toArray } from 'rxjs/operators';
import { Message } from '../models/message';
import { Injectable } from "@angular/core";

interface MessageEntity extends Message {
  id?: number;
  user?: string;
}

@Injectable()
export class ChatHistoryService extends Dexie {
  private history: Dexie.Table<MessageEntity, number>;

  constructor() {
    super('palaver');

    this.version(1).stores({
      history: '++id, user',
    });

    // in pure TS environments, this is not needed. However we intend to use the library in non-TS as well, so for safety, we put it here
    this.history = this.table('history');
  }

  loadHistory$(user: string): Observable<Message[]> {
    return defer(() => this.history.filter(message => message.user === user).toArray());
  }

  addHistory$(user: string, message: Message): Observable<void> {
    return defer(() => this.history.add({ ...message, user }))
      .pipe(mapTo(undefined));
  }

  allUsers$(): Observable<string[]> {
    return defer(() => this.history.toArray()).pipe(
      flatMap(users => from(users.sort())),
      map(user => user.user),
      distinctUntilChanged(),
      toArray(),
    );
  }

  purge(): Observable<void> {
    return defer(() => this.history.clear());
  }
}
