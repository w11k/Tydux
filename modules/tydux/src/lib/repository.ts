import {Commands} from "./commands";
import {arrayAppend, arrayInsertAtIndex, arrayPrepend, objectPatch, swapPositions} from "./commands-mutators";

type FilterFlags<Base, Condition> = {
    [Key in keyof Base]:
    Base[Key] extends Condition ? Key : never
};

type AllowedNames<Base, Condition> =
    FilterFlags<Base, Condition>[keyof Base];

export type FieldsOfType<Base, Condition> =
    Pick<Base, AllowedNames<Base, Condition>>;

export type RepositoryState<T> = {
    idField: string;
    byList: T[];
    byId: { [id: string]: T };
};

export type RepositoryType<R /*extends RepositoryState<unknown>*/> = R extends RepositoryState<infer T> ? T : never;

export type RequireAtLeastOne<T> = { [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>; }[keyof T];

export type Update<T> = {
    id: string;
    // changes: RequireAtLeastOne<T>;
    changes: Partial<T>;
};

export type Position = 'start' | 'end' | number;

export function createRepositoryState<T>(idField: keyof FieldsOfType<T, string | number>): RepositoryState<T> {
    const s = idField.toString();
    return {
        idField: s,
        byList: [] as T[],
        byId: {} as { [id: string]: T },
    };
}

export class RepositoryCommands<S> extends Commands<S> {

    constructor() {
        super();
        Object.setPrototypeOf(this, RepositoryCommands.prototype);
    }

    private getRepositoryState(field: keyof S): RepositoryState<unknown> {
        return (this.state as any)[field];
    }

    private getEntryIndex(field: keyof S, entryId: string): number {
        const repo = this.getRepositoryState(field);
        return repo.byList.findIndex((e) => (e as any)[repo.idField] === entryId);
    }

    updateOrPushEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        entry: RepositoryType<S[F]>,
        position?: Position
    ) {
        const repo = this.getRepositoryState(repositoryField);
        const entryId = (entry as any)[repo.idField];
        const entryIndex = this.getEntryIndex(repositoryField, entryId);
        const entryExists = !!repo.byList.find((e) => (e as any)[repo.idField] === (entry as any)[repo.idField]);

        entryExists ? repo.byList[entryIndex] = entry : repo.byList = arrayAppend(repo.byList)([entry]);
        repo.byId[entryId] = entry;

        if (position) {
            this.setPositionOfEntry(repositoryField, entry, position);
        }
    }

    setPositionOfEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        entry: RepositoryType<S[F]>,
        position?: Position
    ) {
        const repo = this.getRepositoryState(repositoryField);

        const entryExists = !!repo.byList.find((e) => (e as any)[repo.idField] === (entry as any)[repo.idField]);

        if (!entryExists) {
            throw new Error('Entry does not exist');
        }

        const entryId = (entry as any)[repo.idField];
        const entryIndex = this.getEntryIndex(repositoryField, entryId);
        const updatedIndex = position === 'start' ? 0 : position === 'end' ? repo.byList.length - 1 : position;

        if (updatedIndex != null) {
            repo.byList = swapPositions(repo.byList, updatedIndex, entryIndex);
        }
    }

    updateOrPushEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        entries: RepositoryType<S[F]>[] | Record<string, RepositoryType<S[F]>>,
        position?: Position
    ) {
        const entryArr = Array.isArray(entries) ? entries : Object.values(entries);

        entryArr.forEach((entry) => {
            this.updateOrPushEntry(repositoryField, entry);
        });

        if (position) {
            this.setPositionOfEntries(repositoryField, entryArr, position);
        }
    }

    setPositionOfEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        entries: RepositoryType<S[F]>[],
        position?: Position
    ) {

        const repo = this.getRepositoryState(repositoryField);
        const allEntriesExist = entries.every((e) => repo.byList.includes((e)));

        if (!allEntriesExist) {
            throw new Error('Some of the entries do not exist');
        }

        const itemsNotInEntries: RepositoryType<S[F]>[] = repo.byList.filter((e) => !entries.includes((e as any))) as any;

        if (position === "start") {
            repo.byList = arrayPrepend(itemsNotInEntries)(entries);
        } else if (position === "end") {
            repo.byList = arrayAppend(itemsNotInEntries)(entries);
        } else if (typeof position === "number") {
            repo.byList = arrayInsertAtIndex(itemsNotInEntries, position)(entries);
        }
    }

    patchEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        update: Update<RepositoryType<S[F]>>
    ) {
        const repo = this.getRepositoryState(repositoryField);
        const entryExists = repo.byList.find((e) => (e as any)[repo.idField] === update.id);

        if (!entryExists) {
            throw new Error("Entry does not exist");
        }

        const patchedResult = objectPatch(entryExists)(update.changes);
        const entryIndex = this.getEntryIndex(repositoryField, update.id);

        repo.byId[update.id] = patchedResult;
        repo.byList[entryIndex] = patchedResult;
    }

    patchEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        updates: Update<RepositoryType<S[F]>>[]
    ) {
        const repo = this.getRepositoryState(repositoryField);
        const allEntriesExist = updates
            .map((update) => update.id)
            .every((e) => repo.byList.map((entry) => (entry as any)[repo.idField]).includes((e)));

        if (!allEntriesExist) {
            throw new Error("Some of the entries do not exist");
        }

        updates.forEach((update) => {
            this.patchEntry(repositoryField, update);
        });
    }

    removeEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        id: string
    ) {
        const repo = this.getRepositoryState(repositoryField);

        repo.byId[id] = undefined;
        repo.byList = repo.byList.filter((e) => (e as any)[repo.idField] !== id);
    }

    removeEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F,
        ids: string[]
    ) {
        ids.forEach((id) => {
            this.removeEntry(repositoryField, id);
        });
    }

    removeAllEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown> | undefined>>(
        repositoryField: F
    ) {
        const repo = this.getRepositoryState(repositoryField);
        repo.byList = [];
        repo.byId = {};
    }
}
