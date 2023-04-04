const SEGMENT_PATTERN_REGEXP = /^((\w+\/)*):?\w+((\/:\w+)+)?$/g;

export function isRegExp(value: any): boolean {
    return value instanceof RegExp || (typeof value === "object" && Object.prototype.toString.call(value) === "[object RegExp]");
}

export function isSegmentUrl(url:any):boolean{
    if (!isString(url)){
        return false;
    }
    return SEGMENT_PATTERN_REGEXP.test(url)
}

export function isString(value:any){
    return typeof value === "string";
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