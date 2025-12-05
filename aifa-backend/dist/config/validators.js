"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validators = void 0;
class Validators {
    data;
    constructor(data) {
        this.data = data;
    }
    requiredKeys(...keys) {
        keys.forEach(k => {
            const value = this.data[k];
            if (value === undefined || value === null) {
                throw `${k} faltante`;
            }
        });
    }
    isRequired(key) {
        if (!this.data[key])
            throw `${key} faltante`;
    }
    isEmail(key) {
        this.isRequired(key);
        const regular = /^(([^<>()\[\]\\.,;:\s@”]+(\.[^<>()\[\]\\.,;:\s@”]+)*)|(“.+”))@((\[[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}])|(([a-zA-Z\-0–9]+\.)+[a-zA-Z]{2,}))$/;
        if (!regular.test(this.data[key]))
            throw `${key} no es un correo valido`;
    }
    isUIID(key) {
        this.isRequired(key);
        const relugar = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!relugar.test(this.data[key]))
            throw `${key} no es un UUID valido`;
    }
    checkLength(key, min, max) {
        this.isRequired(key);
        const length = String(this.data[key]).length;
        if (length < min || length > max) {
            throw `${key} debe tener entre ${min} y ${max} caracteres`;
        }
    }
    isNumber(key) {
        this.isRequired(key);
        if (isNaN(this.data[key]))
            throw `${key} no es un numero valido`;
        this.data[key] = parseInt(this.data[key]);
    }
    isFloat(key) {
        this.isRequired(key);
        if (isNaN(this.data[key]))
            throw `${key} no es un numero valido`;
        this.data[key] = parseFloat(this.data[key]);
    }
    maxLength(key, max) {
        this.isRequired(key);
        const value = String(this.data[key]);
        if (value.length > max) {
            throw `${key} no debe exceder los ${max} caracteres`;
        }
    }
    capitalizar(key) {
        this.isRequired(key);
        const str = this.data[key];
        const array = str.split(' ');
        array.forEach((s, i) => {
            s = s.toLowerCase();
            const primarCaracter = s.at(0)?.toUpperCase();
            const restoCadena = s.slice(1);
            ;
            array[i] = primarCaracter + restoCadena;
        });
        this.data[key] = array.join(' ');
    }
    minValue(key, min) {
        this.isRequired(key);
        const value = Number(this.data[key]);
        if (value < min) {
            throw `${key} debe ser mayor o igual a ${min}`;
        }
    }
    maxValue(key, max) {
        this.isRequired(key);
        const value = Number(this.data[key]);
        if (value > max) {
            throw `${key} debe ser menor o igual a ${max}`;
        }
    }
    isUrl(key) {
        this.isRequired(key);
        try {
            new URL(this.data[key]);
        }
        catch (_) {
            throw `${key} debe ser una URL válida`;
        }
    }
    includes(key, array) {
        this.isRequired(key);
        if (!array.includes(this.data[key]))
            throw `${key} no pertenece a ${array}`;
    }
    isBoolean(key) {
        if (typeof this.data[key] !== 'boolean')
            throw `${key} no es un boolean valido`;
    }
    toUpperCase(key) {
        this.isRequired(key);
        this.data[key] = this.data[key].toUpperCase();
    }
    isDate(key) {
        this.isRequired(key);
        const newDate = new Date(this.data[key]);
        if (newDate.toString() === 'Invalid Date')
            throw `${key} no es una fecha valida`;
        this.data[key] = newDate;
    }
    isString(key) {
        this.isRequired(key);
        if (typeof this.data[key] !== "string")
            throw `${key} no es una cadena valida`;
        this.data[key] = this.data[key];
    }
    isArray(key) {
        this.isRequired(key);
        if (!Array.isArray(this.data[key]))
            throw `${key} no es un array`;
    }
    isInteger(key) {
        this.isRequired(key);
        const value = this.data[key];
        if (!Number.isInteger(value)) {
            throw `${key} debe ser un número entero`;
        }
    }
    isDecimal(key) {
        this.isRequired(key);
        const value = this.data[key];
        if (typeof value !== "number" || !/^\d+(\.\d{1,2})?$/.test(value.toString())) {
            throw `${key} debe ser un número decimal con máximo 2 decimales`;
        }
    }
    minLength(key, min) {
        this.isRequired(key);
        const value = this.data[key];
        if (typeof value !== "string" || value.length < min) {
            throw `${key} debe tener al menos ${min} caracteres`;
        }
    }
    isPositive(key) {
        this.isRequired(key);
        const value = Number(this.data[key]);
        if (value <= 0) {
            throw `${key} debe ser un número positivo`;
        }
    }
    checkPattern(key, pattern, message) {
        this.isRequired(key);
        if (!pattern.test(this.data[key])) {
            throw message || `${key} no cumple con el formato requerido`;
        }
    }
    ifExistIsString(key) {
        if (this.data[key])
            this.isString(key);
    }
    ifExistCapitalizar(key) {
        if (this.data[key] && this.data[key].lenght !== 0)
            this.capitalizar(key);
    }
    ifExistIsUrl(key) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.isUrl(key);
        }
    }
    ifExistIsNumber(key) {
        if (this.data[key])
            this.isNumber(key);
    }
    ifExistIsFloat(key) {
        if (this.data[key])
            this.isFloat(key);
    }
    ifExistIsDate(key) {
        if (this.data[key])
            this.isDate(key);
    }
    ifExistUpperCase(key) {
        if (this.data[key])
            this.toUpperCase(key);
    }
    ifExistIsUUID(key) {
        if (this.data[key])
            this.isUIID(key);
    }
    ifExistsCheckPattern(key, pattern) {
        if (this.data[key])
            this.checkPattern(key, pattern);
    }
    ifExistIsEmail(key) {
        if (this.data[key])
            this.isEmail(key);
    }
    ifExistIncludes(key, array) {
        if (this.data[key])
            this.includes(key, array);
    }
    ifExistCheckLength(key, min, max) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.checkLength(key, min, max);
        }
    }
    ifExistMinValue(key, min) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.minValue(key, min);
        }
    }
    ifExistMaxValue(key, max) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.maxValue(key, max);
        }
    }
    ifExistCheckPattern(key, pattern, message) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.checkPattern(key, pattern, message);
        }
    }
    ifExistMaxLength(key, max) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            const value = String(this.data[key]);
            if (value.length > max) {
                throw `${key} no debe exceder los ${max} caracteres`;
            }
        }
    }
    isPhoneNumber(key) {
        this.isRequired(key);
        const phoneNumberPattern = /^\+?[1-9]\d{1,14}$/;
        if (!phoneNumberPattern.test(this.data[key])) {
            throw `${key} no es un número de teléfono válido`;
        }
    }
    ifExistIsPhoneNumber(key) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.isPhoneNumber(key);
        }
    }
    checkValues(key, values) {
        this.isRequired(key);
        if (!values.includes(this.data[key])) {
            throw `${key} debe ser uno de los siguientes valores: ${values.join(", ")}`;
        }
    }
    ifExistIsPositive(key) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.isPositive(key);
        }
    }
}
exports.Validators = Validators;
//# sourceMappingURL=validators.js.map