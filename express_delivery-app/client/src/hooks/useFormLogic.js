import { useState, useCallback, useMemo } from 'react';

/**
 * Универсальный hook для логики форм
 * Управляет: состояние, валидация, маски, обработчики
 * 
 * @param {Object} config - конфиг полей
 * @param {Function} onSubmit - функция отправки данных
 * @param {Object} initialValues - начальные значения (опционально)
 */
export const useFormLogic = (config, onSubmit, initialValues = {}) => {
  // Создаём начальное состояние на основе конфига
  const initialForm = useMemo(() => {
    const form = {};
    Object.keys(config).forEach(fieldName => {
      form[fieldName] = initialValues[fieldName] ?? '';
    });
    return form;
  }, [config, initialValues]);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Валидация одного поля
  const validateField = useCallback((fieldName, value, fieldConfig) => {
    if (!fieldConfig.validators) return null;

    const validators = Array.isArray(fieldConfig.validators)
      ? fieldConfig.validators
      : [fieldConfig.validators];

    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }

    return null;
  }, []);

  // Валидация всей формы
  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.entries(config).forEach(([fieldName, fieldConfig]) => {
      const error = validateField(fieldName, form[fieldName], fieldConfig);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [form, config, validateField]);

  // Изменение поля
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const fieldConfig = config[name];

    let formattedValue = value;

    // Применяем маску если есть
    if (fieldConfig?.mask) {
      formattedValue = fieldConfig.mask(value);
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }));

    // Убираем ошибку при редактировании
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }, [config, errors]);

  // Отправка формы
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      console.error('Form submission error:', err);
      setErrors({
        submit: err.message || 'Ошибка при сохранении данных',
      });
    } finally {
      setLoading(false);
    }
  }, [form, validateForm, onSubmit]);

  // Сброс формы
  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
  }, [initialForm]);

  // Установка значения поля вручную
  const setFieldValue = useCallback((fieldName, value) => {
    setForm(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  // Получить пропсы для Input компонента
  const getFieldProps = useCallback((fieldName) => {
    const fieldConfig = config[fieldName];
    return {
      name: fieldName,
      value: form[fieldName],
      onChange: handleChange,
      error: errors[fieldName],
      ...fieldConfig?.inputProps,
    };
  }, [form, errors, handleChange, config]);

  return {
    form,
    errors,
    loading,
    handleChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    setForm,
    getFieldProps,
    setErrors,
  };
};
