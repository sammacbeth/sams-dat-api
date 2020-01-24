export type SuccessCallback = (error: Error) => void;
export type ResultCallback<T> = (error: Error, result?: T) => void;