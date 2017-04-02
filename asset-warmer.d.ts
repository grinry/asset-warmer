import Options = warmer.Options;
import EntryFile = warmer.EntryFile;
declare function Warmer(files: EntryFile | string | Array<string | EntryFile>, options?: Options): warmer.Warmer;

declare namespace warmer {
    type FileStatus = 'pending' | 'progress' | 'finished' | 'failed' | 'flight';
    type UpdateEventType = 'asset_progress' | 'asset_loaded' | 'asset_failed';
    type ProgressInfoResultType = 'finished' | 'progress';
    type EventType = 'update' | 'asset_appended' | 'finished' | 'appened';

    interface Warmer {
        on(eventName: EventType, eventArgs: UpdateEvent | Array<File> | File): Warmer;
    }

    interface Options {
        byOrder?: boolean;
        appendStyles?: boolean;
        appendScripts?: boolean;
        appendAtOnce?: boolean;
        appendWhenDone?: boolean;
    }

    interface EntryFile {
        src: string;
        name?: string;
        size?: number;
    }

    interface UpdateEvent {
        file: File,
        type: UpdateEventType,
        progress: ProgressInfo,
        event: Event,
        errorType?: string
    }

    interface File {
        src: string;
        name: string;
        total: boolean;
        loaded: number;
        percentage: number;
        knownLength: boolean;
        type: string;
        status: FileStatus;
    }

    interface ProgressInfo {
        bytes: ProgressInfoBytes;
        files: ProgressInfoFiles;
        result: ProgressInfoResultType
    }

    interface ProgressInfoBytes {
        loaded: number,
        total: number,
        percentage: number
    }

    interface ProgressInfoFiles {
        loaded: number,
        loading: number,
        total: number,
        percentage: number
    }
}

export = warmer;
