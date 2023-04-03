function generatePatternRegex(pattern: string): RegExp {
    const regexPattern = pattern
        .replace(/:[^/]+/g, "([^/]+)")
        .replace(/\//g, "\\/");
    return new RegExp(`^${regexPattern}$`);
}

const test = /^((\w+\/)*):?\w+((\/:\w+)+)?$/g;

function isRegExp(value: any): boolean {
    return value instanceof RegExp || (typeof value === "object" && Object.prototype.toString.call(value) === "[object RegExp]");
}

export function getTopicType(topic: any) {
    if (typeof topic === "string") {
        if (test.test(topic)) {
            return "segment";
        }
        return "string";
    } else if (isRegExp(topic)) {
        return "regexp";
    } else if (Array.isArray(topic) && topic.every(elem => typeof elem === "string")) {
        return "arr_string";
    } else if (Array.isArray(topic) && topic.every(elem => {
        try {
            new RegExp(elem);
            return true;
        } catch (e) {
            return false;
        }
    })) {
        return "arr_regexp";
    } else {
        return "unknown";
    }
}

export function extractSegments(url: string, pattern: string): object {
    const patternRegex = generatePatternRegex(pattern);
    const match = patternRegex.exec(url);
    if (!match) {
        return null;
    }
    const keys = pattern.match(/:[^/]+/g).map((key) => key.slice(1));
    const values = match.slice(1);
    return keys.reduce((obj, key, i) => {
        obj[key] = values[i];
        return obj;
    }, {});
}
