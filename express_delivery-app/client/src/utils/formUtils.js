/**
 * МАСКИ ДЛЯ ВВОДА
 * Функции форматирования значений в реальном времени
 */

export const masks = {
  // Телефон: +7 (XXX) XXX-XX-XX
  phone: (value) => {
    let digits = value.replace(/\D/g, '');
    digits = digits.substring(0, 16);

    if (!digits) return '';

    let formatted = '+7 (';
    const rest = digits.startsWith('7') || digits.startsWith('8')
      ? digits.substring(1)
      : digits;

    if (rest.length === 0) return '+7 (';

    formatted += rest.substring(0, 3);
    if (rest.length >= 3) formatted += ') ';
    if (rest.length > 3) formatted += rest.substring(3, 6);
    if (rest.length > 6) formatted += '-' + rest.substring(6, 8);
    if (rest.length > 8) formatted += '-' + rest.substring(8, 10);

    return formatted;
  },

  // Паспорт: 1234 567890 (10 цифр)
  passport: (value) => {
    let digits = value.replace(/\D/g, '').substring(0, 10);
    if (!digits) return '';
    if (digits.length <= 4) return digits;
    return digits.substring(0, 4) + ' ' + digits.substring(4);
  },

  // Почтовый индекс: 123456 (6 цифр)
  postalIndex: (value) => {
    return value.replace(/\D/g, '').substring(0, 6);
  },

  // Табельный номер: только цифры до 10
  staffNumber: (value) => {
    return value.replace(/\D/g, '').substring(0, 10);
  },

  // Надбавка/зарплата: число с двумя знаками после запятой
  decimal: (value) => {
    let cleaned = value.replace(/[^\d.,]/g, '');
    cleaned = cleaned.replace(',', '.');

    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    if (parts[1]?.length > 2) {
      cleaned = `${parts[0]}.${parts[1].substring(0, 2)}`;
    }

    return cleaned;
  },

  // Только буквы (имена, города и т.д.)
  lettersOnly: (value) => {
    return value.replace(/[^а-яёА-ЯЁ\s-]/g, '');
  },

  // Без ограничений, но обрезает по длине
  text: (value, maxLength) => {
    return value.substring(0, maxLength);
  },
};

/**
 * ВАЛИДАТОРЫ
 * Функции проверки значений (возвращают текст ошибки или null)
 */

export const validators = {
  // Требуемое поле
  required: (fieldName = 'Поле') => (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${fieldName} обязательно`;
    }
    return null;
  },

  // Минимальная длина (для текста или цифр)
  minLength: (length, fieldName = 'Поле') => (value) => {
    const str = String(value).trim();
    if (str && str.length < length) {
      return `${fieldName} должно быть минимум ${length} символов`;
    }
    return null;
  },

  // Максимальная длина
  maxLength: (length, fieldName = 'Поле') => (value) => {
    const str = String(value).trim();
    if (str && str.length > length) {
      return `${fieldName} должно быть максимум ${length} символов`;
    }
    return null;
  },

  // Ровно N символов
  exactLength: (length, fieldName = 'Поле') => (value) => {
    const digits = String(value).replace(/\D/g, '');
    if (digits && digits.length !== length) {
      return `${fieldName} должно быть ровно ${length} цифр`;
    }
    return null;
  },

  // Email
  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Некорректный email';
    }
    return null;
  },

  // Число в диапазоне
  numberRange: (min, max, fieldName = 'Число') => (value) => {
    if (value === '' || value === null) return null;
    const num = Number(value);
    if (Number.isNaN(num) || num < min || num > max) {
      return `${fieldName} должно быть от ${min} до ${max}`;
    }
    return null;
  },

  // Целое число
  integer: (fieldName = 'Число') => (value) => {
    if (value === '' || value === null) return null;
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isInteger(num)) {
      return `${fieldName} должно быть целым числом`;
    }
    return null;
  },

  // Количество цифр
  digitCount: (count, fieldName = 'Поле') => (value) => {
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length !== count) {
      return `${fieldName} должно содержать ровно ${count} цифр`;
    }
    return null;
  },

  // Кастомный валидатор
  custom: (fn, errorMessage = 'Ошибка валидации') => (value) => {
    return fn(value) ? null : errorMessage;
  },
};

export const combineValidators = (...validatorFunctions) => (value) => {
  for (const validator of validatorFunctions) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};
