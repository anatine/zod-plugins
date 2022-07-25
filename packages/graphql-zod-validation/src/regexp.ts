// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags
export const isConvertableRegexp = (maybeRegexp: string): boolean => /^\/.*\/[dgimsuy]*$/.test(maybeRegexp);
