const SEGMENT_PATTERN_REGEXP = /^((\w+\/)*):?\w+((\/:\w+)+)?$/g;

export function isRegExp(value: any): boolean {
    return value instanceof RegExp || (typeof value === "object" && Object.prototype.toString.call(value) === "[object RegExp]");
}

export function isSegmentUrl(url:string):boolean{
    return SEGMENT_PATTERN_REGEXP.test(url)
}

export function isEveryElementString(arr:any):boolean{
    return arr.every(elem => typeof elem === "string")
}

export function isEveryElementRegExp(arr:any):boolean{
    return arr.every(elem => {
        try {
            new RegExp(elem);
            return true;
        } catch (e) {
            return false;
        }
    })
}