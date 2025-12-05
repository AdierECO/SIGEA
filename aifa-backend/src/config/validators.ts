
export class Validators {

    constructor(
        public readonly data: { [key: string]: any }
    ) { }

    public requiredKeys(...keys: string[]) {
        keys.forEach(k => {
            const value = this.data[k];
            if (value === undefined || value === null) {
                throw `${k} faltante`;
            }
        })
    }

    public isRequired(key: string) {
        if (!this.data[key]) throw `${key} faltante`;
    }

    public isEmail(key: string) {
        this.isRequired(key);
        const regular = /^(([^<>()\[\]\\.,;:\s@”]+(\.[^<>()\[\]\\.,;:\s@”]+)*)|(“.+”))@((\[[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}])|(([a-zA-Z\-0–9]+\.)+[a-zA-Z]{2,}))$/;
        if (!regular.test(this.data[key])) throw `${key} no es un correo valido`;
    }

    public isUIID(key: string) {
        this.isRequired(key);
        const relugar = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!relugar.test(this.data[key])) throw `${key} no es un UUID valido`;
    }

    public checkLength(key: string, min: number, max: number) {
        this.isRequired(key);
        const length = String(this.data[key]).length;
        if (length < min || length > max) {
            throw `${key} debe tener entre ${min} y ${max} caracteres`;
        }
    }

    public isNumber(key: string) {
        this.isRequired(key);
        if (isNaN(this.data[key])) throw `${key} no es un numero valido`;
        this.data[key] = parseInt(this.data[key]);
    }

    public isFloat(key: string) {
        this.isRequired(key);
        if (isNaN(this.data[key])) throw `${key} no es un numero valido`;
        this.data[key] = parseFloat(this.data[key]);
    }

    public maxLength(key: string, max: number): void {
        this.isRequired(key);
        const value = String(this.data[key]);
        if (value.length > max) {
            throw `${key} no debe exceder los ${max} caracteres`;
        }
    }

    public capitalizar(key: string) {
        this.isRequired(key);
        const str = this.data[key] as string;
        const array = str.split(' ');
        array.forEach((s, i) => {
            s = s.toLowerCase();
            const primarCaracter = s.at(0)?.toUpperCase();
            const restoCadena = s.slice(1);;
            array[i] = primarCaracter + restoCadena;
        });

        this.data[key] = array.join(' ');
    }
    public minValue(key: string, min: number) {
        this.isRequired(key);
        const value = Number(this.data[key]);
        if (value < min) {
            throw `${key} debe ser mayor o igual a ${min}`;
        }
    }

    public maxValue(key: string, max: number) {
        this.isRequired(key);
        const value = Number(this.data[key]);
        if (value > max) {
            throw `${key} debe ser menor o igual a ${max}`;
        }
    }

    public isUrl(key: string) {
        this.isRequired(key);
        try {
            new URL(this.data[key]);
        } catch (_) {
            throw `${key} debe ser una URL válida`;
        }
    }

    public includes(key: string, array: any[]) {
        this.isRequired(key);
        if (!array.includes(this.data[key])) throw `${key} no pertenece a ${array}`;
    }

    public isBoolean(key: string) {
        if (typeof this.data[key] !== 'boolean') throw `${key} no es un boolean valido`;
    }

    public toUpperCase(key: string) {
        this.isRequired(key);
        this.data[key] = (this.data[key] as string).toUpperCase();
    }

    public isDate(key: string) {
        this.isRequired(key);
        const newDate = new Date(this.data[key]);
        if (newDate.toString() === 'Invalid Date') throw `${key} no es una fecha valida`;
        this.data[key] = newDate;
    }

    public isString(key: string) {
        this.isRequired(key);
        if (typeof this.data[key] !== "string") throw `${key} no es una cadena valida`;
        this.data[key] = this.data[key] as string;
    }

    public isArray(key: string) {
        this.isRequired(key);
        if (!Array.isArray(this.data[key])) throw `${key} no es un array`;
    }


    public isInteger(key: string) {
        this.isRequired(key);
        const value = this.data[key];
        if (!Number.isInteger(value)) {
            throw `${key} debe ser un número entero`;
        }
    }

    public isDecimal(key: string) {
        this.isRequired(key);
        const value = this.data[key];
        if (typeof value !== "number" || !/^\d+(\.\d{1,2})?$/.test(value.toString())) {
            throw `${key} debe ser un número decimal con máximo 2 decimales`;
        }
    }

    public minLength(key: string, min: number) {
        this.isRequired(key);
        const value = this.data[key];
        if (typeof value !== "string" || value.length < min) {
            throw `${key} debe tener al menos ${min} caracteres`;
        }
    }

    public isPositive(key: string) {
        this.isRequired(key);
        const value = Number(this.data[key]);
        if (value <= 0) {
            throw `${key} debe ser un número positivo`;
        }
    }

    public checkPattern(key: string, pattern: RegExp, message?: string) {
        this.isRequired(key);
        if (!pattern.test(this.data[key])) {
            throw message || `${key} no cumple con el formato requerido`;
        }
    }

    public ifExistIsString(key: string) {
        if (this.data[key]) this.isString(key);
    }

    public ifExistCapitalizar(key: string) {
        if (this.data[key] && this.data[key].lenght !== 0) this.capitalizar(key);
    }

    public ifExistIsUrl(key: string) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.isUrl(key);
        }
    }

    public ifExistIsNumber(key: string) {
        if (this.data[key]) this.isNumber(key);
    }

    public ifExistIsFloat(key: string) {
        if (this.data[key]) this.isFloat(key);
    }

    public ifExistIsDate(key: string) {
        if (this.data[key]) this.isDate(key);
    }

    public ifExistUpperCase(key: string) {
        if (this.data[key]) this.toUpperCase(key);
    }

    public ifExistIsUUID(key: string) {
        if (this.data[key]) this.isUIID(key);
    }

    public ifExistsCheckPattern(key: string, pattern: RegExp) {
        if (this.data[key]) this.checkPattern(key, pattern);
    }

    public ifExistIsEmail(key: string) {
        if (this.data[key]) this.isEmail(key);
    }

    public ifExistIncludes(key: string, array: any[]) {
        if (this.data[key]) this.includes(key, array);
    }

    public ifExistCheckLength(key: string, min: number, max: number) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.checkLength(key, min, max);
        }
    }

    public ifExistMinValue(key: string, min: number) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.minValue(key, min);
        }
    }

    public ifExistMaxValue(key: string, max: number) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.maxValue(key, max);
        }
    }
    public ifExistCheckPattern(key: string, pattern: RegExp, message?: string) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.checkPattern(key, pattern, message);
        }
    }
    public ifExistMaxLength(key: string, max: number): void {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            const value = String(this.data[key]);
            if (value.length > max) {
                throw `${key} no debe exceder los ${max} caracteres`;
            }
        }
    }
    public isPhoneNumber(key: string) {
        this.isRequired(key);
        const phoneNumberPattern = /^\+?[1-9]\d{1,14}$/;
        if (!phoneNumberPattern.test(this.data[key])) {
            throw `${key} no es un número de teléfono válido`;
        }
    }
    public ifExistIsPhoneNumber(key: string) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.isPhoneNumber(key);
        }
    }

    public checkValues(key: string, values: any[string]) {
        this.isRequired(key);
        if (!values.includes(this.data[key])) {
            throw `${key} debe ser uno de los siguientes valores: ${values.join(", ")}`;
        }

    }

    public ifExistIsPositive(key: string) {
        if (this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '') {
            this.isPositive(key);
        }
    }
}