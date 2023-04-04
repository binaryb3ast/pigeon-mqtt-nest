const SEGMENT_PATTERN_REGEXP = /^((\w+\/)*):?\w+((\/:\w+)+)?$/g;


export function isRegExp(value: any): boolean {
    return value instanceof RegExp || (typeof value === "object" && Object.prototype.toString.call(value) === "[object RegExp]");
}

export function isSegmentUrl(url:string):boolean{
    return SEGMENT_PATTERN_REGEXP.test(url)
}