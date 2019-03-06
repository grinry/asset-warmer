export class WarmerEvent {
    private _name: string;
    private _callbacks: Array<any>;
    constructor(name: string) {
        this._name = name;
        this._callbacks = [];
    }
}

export class Warmer {
    constructor() {}
}