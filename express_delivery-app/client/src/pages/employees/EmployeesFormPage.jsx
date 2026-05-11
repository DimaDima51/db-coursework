import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { createEmployee, updateEmployee, getPositions, getPickupPoints } from '../../api/axios';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useFormLogic } from '../../hooks/useFormLogic';

import { masks, validators, combineValidators } from '../../utils/formUtils';
import styles from './../default.module.css';

// Конфиг полей формы
const EMPLOYEE_FORM_CONFIG = {
    staff_number: {
        mask: masks.staffNumber,
        validators: combineValidators(
            validators.required('Табельный номер'),
            validators.numberRange(0, 999999, 'Табельный номер')
        ),
        inputProps: {
            label: 'Табельный номер',
            placeholder: '123456',
            required: true,
        },
    },
    surname: {
        validators: combineValidators(
            validators.required('Фамилия'),
            validators.maxLength(100, 'Фамилия')
        ),
        inputProps: {
            label: 'Фамилия',
            placeholder: 'Иванов',
            required: true,
        },
    },
    first_name: {
        validators: combineValidators(
            validators.required('Имя'),
            validators.maxLength(100, 'Имя')
        ),
        inputProps: {
            label: 'Имя',
            placeholder: 'Иван',
            required: true,
        },
    },
    patronymic: {
        validators: validators.maxLength(100, 'Отчество'),
        inputProps: {
            label: 'Отчество',
            placeholder: 'Иванович',
        },
    },
    pickup_point_index: {
        validators: validators.required('Индекс пункта выдачи'),
        inputProps: {
            label: 'Индекс пункта выдачи',
            required: true,
        },
    },
    position_name: {
        validators: validators.required('Должность'),
        inputProps: {
            label: 'Должность',
            required: true,
        },
    },
    allowance: {
        mask: masks.decimal,
        validators: validators.numberRange(0, 999999.99, 'Надбавка'),
        inputProps: {
            label: 'Надбавка',
            placeholder: '5000.00',
        },
    },
    note: {
        inputProps: {
            label: 'Примечание',
            placeholder: 'Введите примечание',
        },
    },
};

export const EmployeesFormPage = () => {
    const navigate = useNavigate();
    const { staff_number } = useParams();
    const location = useLocation();
    const isEditMode = !!staff_number;

    const {
        data: positions = [],
        loading: positionsLoading,
    } = useAsyncData(async () => {
        const response = await getPositions();
        return response.data || [];
    }, []);

    const {
        data: pickupPoints = [],
        loading: pickupPointsLoading,
    } = useAsyncData(async () => {
        const response = await getPickupPoints();
        return response.data || [];
    }, []);

    const positionOptions = positions.map((position) => ({
        value: position.position_name,
        label: position.position_name,
    }));

    const pickupPointOptions = pickupPoints.map((point) => ({
        value: point.pickup_point_index,
        label: `${point.pickup_point_index}`,
    }));

    // Используем hook
    const {
        form,
        errors,
        loading,
        handleChange,
        handleSubmit,
        getFieldProps,
        setErrors,
        setForm,
    } = useFormLogic(EMPLOYEE_FORM_CONFIG, async (formData) => {
        // Преобразуем данные для отправки
        const payload = {
            surname: formData.surname.trim(),
            first_name: formData.first_name.trim(),
            patronymic:
                formData.patronymic.trim() || null,
            pickup_point_index: formData.pickup_point_index,
            position_name: formData.position_name,
            allowance: formData.allowance
                ? parseFloat(formData.allowance)
                : 0,
            note: formData.note.trim() || null,
        };

        if (isEditMode) {
            await updateEmployee(staff_number, payload);
        } else {
            payload.staff_number = Number(formData.staff_number);
            const response = await createEmployee(payload);
            
            // Показываем уведомление с сгенерированным паролем
            if (response.generatedPassword) {
                alert(`Сотрудник успешно создан!\n\nСгенерированный пароль: ${response.generatedPassword}\n\nПожалуйста, сохраните этот пароль и передайте сотруднику.`);
            }
        }
        navigate('/employees');
    });

    // Инициализируем форму при редактировании
    useEffect(() => {
        if (isEditMode && location.state?.employee && setForm) {
            const employee = location.state.employee;
            setForm({
                staff_number: employee.staff_number?.toString() || '',
                surname: employee.surname || '',
                first_name: employee.first_name || '',
                patronymic: employee.patronymic || '',
                pickup_point_index: employee.pickup_point_index || '',
                position_name: employee.position_name || '',
                allowance: employee.allowance?.toString() || '',
                note: employee.note || '',
            });
        }
    }, [isEditMode, location.state, setForm]);

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.content}>
                <div className={styles.pageHeader}>
                    <h1>
                        {isEditMode ? 'Редактировать сотрудника' : 'Добавить нового сотрудника'}
                    </h1>
                </div>

                <div className={styles.formContainer}>
                    <form
                        onSubmit={handleSubmit}
                        className={styles.form}
                        noValidate
                    >
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>
                                Личная информация
                            </h2>

                            <div className={styles.formGrid}>
                                <Input
                                    {...getFieldProps('staff_number')}
                                />

                                <Input
                                    {...getFieldProps('surname')}
                                />

                                <Input
                                    {...getFieldProps('first_name')}
                                />

                                <Input
                                    {...getFieldProps('patronymic')}
                                />
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>
                                Должностная информация
                            </h2>

                            <div className={styles.formGrid}>
                                <Select
                                    {...getFieldProps('pickup_point_index')}
                                    options={pickupPointOptions}
                                    placeholder={
                                        pickupPointsLoading
                                            ? 'Загрузка...'
                                            : 'Выберите индекс пункта выдачи'
                                    }
                                    disabled={pickupPointsLoading}
                                />

                                <Select
                                    {...getFieldProps('position_name')}
                                    options={positionOptions}
                                    placeholder={
                                        positionsLoading
                                            ? 'Загрузка...'
                                            : 'Выберите должность'
                                    }
                                    disabled={positionsLoading}
                                />

                                <Input
                                    {...getFieldProps('allowance')}
                                />
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>
                                Дополнительно
                            </h2>

                            <div className={styles.formGrid}>
                                <Input
                                    {...getFieldProps('note')}
                                />
                            </div>
                        </div>

                        {errors.submit && (
                            <div
                                className={
                                    styles.errorBlock
                                }
                            >
                                {errors.submit}
                            </div>
                        )}

                        <div className={styles.buttonGroup}>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                            >
                                {isEditMode ? 'Обновить' : 'Сохранить'}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    navigate('/employees')
                                }
                                disabled={loading}
                            >
                                Отменить
                            </Button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
};