export declare class Validators {
    readonly data: {
        [key: string]: any;
    };
    constructor(data: {
        [key: string]: any;
    });
    requiredKeys(...keys: string[]): void;
    isRequired(key: string): void;
    isEmail(key: string): void;
    isUIID(key: string): void;
    checkLength(key: string, min: number, max: number): void;
    isNumber(key: string): void;
    isFloat(key: string): void;
    maxLength(key: string, max: number): void;
    capitalizar(key: string): void;
    minValue(key: string, min: number): void;
    maxValue(key: string, max: number): void;
    isUrl(key: string): void;
    includes(key: string, array: any[]): void;
    isBoolean(key: string): void;
    toUpperCase(key: string): void;
    isDate(key: string): void;
    isString(key: string): void;
    isArray(key: string): void;
    isInteger(key: string): void;
    isDecimal(key: string): void;
    minLength(key: string, min: number): void;
    isPositive(key: string): void;
    checkPattern(key: string, pattern: RegExp, message?: string): void;
    ifExistIsString(key: string): void;
    ifExistCapitalizar(key: string): void;
    ifExistIsUrl(key: string): void;
    ifExistIsNumber(key: string): void;
    ifExistIsFloat(key: string): void;
    ifExistIsDate(key: string): void;
    ifExistUpperCase(key: string): void;
    ifExistIsUUID(key: string): void;
    ifExistsCheckPattern(key: string, pattern: RegExp): void;
    ifExistIsEmail(key: string): void;
    ifExistIncludes(key: string, array: any[]): void;
    ifExistCheckLength(key: string, min: number, max: number): void;
    ifExistMinValue(key: string, min: number): void;
    ifExistMaxValue(key: string, max: number): void;
    ifExistCheckPattern(key: string, pattern: RegExp, message?: string): void;
    ifExistMaxLength(key: string, max: number): void;
    isPhoneNumber(key: string): void;
    ifExistIsPhoneNumber(key: string): void;
    checkValues(key: string, values: any[string]): void;
    ifExistIsPositive(key: string): void;
}
//# sourceMappingURL=validators.d.ts.map