import {Commands} from "./commands";
import {arrayAppend, arrayInsertAtIndex, arrayPrepend, objectPatch, swapPositions} from "./commands-mutators";
import {getIndexNotInArrayMessage} from "./error-messages";
import {fromEntries} from "./utils";

type FilterFlags<Base, Condition> = {
    [Key in keyof Base]:
    Base[Key] extends Condition ? Key : never
};

type AllowedNames<Base, Condition> =
    FilterFlags<Base, Condition>[keyof Base];

export type FieldsOfType<Base, Condition> =
    Pick<Base, AllowedNames<Base, Condition>>;

type IdField = string | number;

export type RepositoryState<T, ID extends keyof FieldsOfType<T, IdField>> = {
    idField: IdField;
    byList: T[];
    byId: Record<IdField, T>;
};

export type RepositoryType<R /*extends RepositoryState<any, any>*/> = R extends RepositoryState<infer T, any> ? T : never;

export type Update<R> = R extends RepositoryState<infer T, infer ID> ? Required<Pick<T, ID>> & Partial<Exclude<T, ID>> : never;

export type Position = "start" | "end" | number;

export function createRepositoryState<T, ID extends keyof FieldsOfType<T, IdField>>(
    idField: ID,
    defaultState?: T[] | Record<IdField, T>
): RepositoryState<T, ID> {
    const s = idField.toString();
    return {
        idField: s,
        byList: (Array.isArray(defaultState) ? defaultState : Object.values(defaultState || {}) || []) as T[],
        byId: (Array.isArray(defaultState)
            ? fromEntries(defaultState.map((entry) => [(entry as any)[s], entry]))
            : defaultState || {}) as Record<IdField, T>,
    };
}

export class RepositoryCommands<S> extends Commands<S> {

    constructor() {
        super();
        Object.setPrototypeOf(this, RepositoryCommands.prototype);
    }

    private getRepositoryState(field: keyof S): RepositoryState<unknown, never> {
        return (this.state as any)[field];
    }

    private getEntryIndex(repo: RepositoryState<unknown, never>, entryId: string): number {
        return repo.byList.findIndex((e) => (e as any)[repo.idField] === entryId);
    }

    updateOrPushEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown, never> | undefined>>(
        repositoryField: F,
        entry: RepositoryType<S[F]>,
        position?: Position
    ) {
        const repo = this.getRepositoryState(repositoryField);
        const entryId = (entry as any)[repo.idField];
        const entryIndex = this.getEntryIndex(repo, entryId);
        const entryExists = !!repo.byList.find((e) => (e as any)[repo.idField] === (entry as any)[repo.idField]);

        entryExists ? repo.byList[entryIndex] = entry : repo.byList = arrayAppend(repo.byList)([entry]);
        repo.byId[entryId] = entry;

        if (position) {
            this.setPositionOfEntry(repositoryField, entry, position);
        }
    }

    /**
     *  Moves an existing entry to a particular position in the list.
     *  @param position
     *      - If set to "start", the entry will be positioned at the index 0 of the array.
     *      - If set to "end", the entry will be positioned at the last index of the array.
     *      - If specified as a number, the entry will be positioned at the given index.
     */
    setPositionOfEntry<F extends keyof FieldsOfType<S, RepositoryState<unknown, never> | undefined>>(
        repositoryField: F,
        entry: RepositoryType<S[F]>,
        position: Position
    ) {
        const repo = this.getRepositoryState(repositoryField);

        const entryExists = !!repo.byList.find((e) => (e as any)[repo.idField] === (entry as any)[repo.idField]);
        const arrLength = repo.byList.length;

        if (!entryExists) {
            throw new Error("Entry does not exist");
        } else if (position < 0 || position > arrLength - 1) {
            throw new Error(getIndexNotInArrayMessage(arrLength));
        }

        const entryId = (entry as any)[repo.idField];
        const entryIndex = this.getEntryIndex(repo, entryId);
        const updatedIndex = position === "start" ? 0 : position === "end" ? arrLength - 1 : position;

        if (updatedIndex != null) {
            repo.byList = swapPositions(repo.byList, updatedIndex, entryIndex);
        }
    }

    updateOrPushEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown, never> | undefined>>(
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

    /**
     *  Moves multiple existing entries to a particular position in the list.
     *  @param position
     *      - If set to "start", the list of entries will be positioned at the index 0 of the array.
     *      - If set to "end", the list of entries will be positioned at the last index of the array.
     *      - If specified as a number, the the list of entries will be positioned at the given index.
     */
    setPositionOfEntries<F extends keyof FieldsOfType<S, RepositoryState<unknown, never> | undefined>>(
        repositoryField: F,
        entries: RepositoryType<S[F]>[],
        position: Position
    ) {

        const repo = this.getRepositoryState(repositoryField);
        const allEntriesExist = entries.every((e) => repo.byList.includes((e)));

        if (!allEntriesExist) {
            throw new Error("Some of the entries do not exist");
        }

        const itemsNotInEntries: RepositoryType<S[F]>[] = repo.byList.filter((e) => !entries.includes((e as any))) as any;

        if (position === "start") {
            repo.byList = arrayPrepend(itemsNotInEntries)(entries);
        } else if (position === "end") {
            repo.byList = arrayAppend(itemsNotInEntries)(entries);
        } else {
            repo.byList = arrayInsertAtIndex(itemsNotInEntries, position)(entries);
        }
    }

    patchEntry<R extends keyof FieldsOfType<S, RepositoryState<any, any> | undefined>>(
        repositoryField: R,
        update: Update<S[R]>
    ) {
        const repo = this.getRepositoryState(repositoryField);
        const entryId = (update as any)[repo.idField];
        const entryExists = repo.byList.find((e) => (e as any)[repo.idField] === entryId);

        if (!entryExists) {
            throw new Error("Entry does not exist");
        }

        const patchedResult = objectPatch(entryExists)(update);
        const entryIndex = this.getEntryIndex(repo, entryId);

        repo.byId[entryId] = patchedResult;
        repo.byList[entryIndex] = patchedResult;
    }

    patchEntries<R extends keyof FieldsOfType<S, RepositoryState<any, any> | undefined>>(
        repositoryField: R,
        updates: Update<S[R]>[]
    ) {
        const repo = this.getRepositoryState(repositoryField);
        const allEntriesExist = updates
            .map((update) => (update as any)[repo.idField])
            .every((e) => repo.byList.map((entry) => (entry as any)[repo.idField]).includes((e)));

        if (!allEntriesExist) {
            throw new Error("Some of the entries do not exist");
        }

        updates.forEach((update) => {
            this.patchEntry(repositoryField, update);
        });
    }

    removeEntry<R extends keyof FieldsOfType<S, RepositoryState<any, any> | undefined>>(
        repositoryField: R,
        id: IdField
    ) {
        const repo = this.getRepositoryState(repositoryField);

        repo.byId[id] = undefined;
        repo.byList = repo.byList.filter((e) => (e as any)[repo.idField] !== id);
    }

    removeEntries<R extends keyof FieldsOfType<S, RepositoryState<any, any> | undefined>>(
        repositoryField: R,
        ids: (IdField)[]
    ) {
        ids.forEach((id) => {
            this.removeEntry(repositoryField, id);
        });
    }

    removeAllEntries<R extends keyof FieldsOfType<S, RepositoryState<any, any> | undefined>>(
        repositoryField: R
    ) {
        const repo = this.getRepositoryState(repositoryField);
        repo.byList = [];
        repo.byId = {};
    }
}
