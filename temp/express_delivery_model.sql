CREATE DATABASE IF NOT EXISTS express_delivery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
  -- Без utf8mb4 не создать ENUM-поля, которые требуют поддержки символов кириллицы
  
USE express_delivery;

-- 1. Должность
CREATE TABLE `position` (
    `position_name` VARCHAR(100) NOT NULL,
    `tariff_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`position_name`),
    CHECK (`tariff_rate` >= 0)
);

-- 2. Клиент
CREATE TABLE `client` (
    `passport_number` CHAR(10) NOT NULL,
    `surname` VARCHAR(100) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `patronymic` VARCHAR(100) NULL DEFAULT NULL,
    `phone` VARCHAR(16) NOT NULL,
    `postal_index` CHAR(6) NOT NULL,
    `region` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `house` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NULL DEFAULT NULL,
    PRIMARY KEY (`passport_number`),
    UNIQUE KEY `uk_client_phone` (`phone`),
    CHECK (`passport_number` REGEXP '^[0-9]{10}$'),
    CHECK (`postal_index` REGEXP '^[0-9]{6}$')
);

-- 3. Пункт приема и выдачи
CREATE TABLE `pickup_point` (
    `pickup_point_index` CHAR(6) NOT NULL,
    `branch_name` VARCHAR(100) NOT NULL,
    `region` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `house` VARCHAR(255) NOT NULL,
    `municipality` VARCHAR(255) NOT NULL,
    `oktmo` BIGINT UNSIGNED NOT NULL,
    `service_windows_count` INT NOT NULL,
    `accessibility_for_mgn` BOOLEAN NULL DEFAULT NULL,
    `hotline_phone` VARCHAR(16) NULL DEFAULT NULL,
    `work_mode` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`pickup_point_index`),
    CHECK (`pickup_point_index` REGEXP '^[0-9]{6}$'),
    CHECK (`service_windows_count` > 0)
);

-- 4. Сотрудник
CREATE TABLE `employee` (
    `staff_number` INT UNSIGNED NOT NULL,
    `surname` VARCHAR(100) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `patronymic` VARCHAR(100) NULL DEFAULT NULL,
    `pickup_point_index` CHAR(6) NOT NULL,
    `position_name` VARCHAR(100) NOT NULL,
    `allowance` DECIMAL(10,2) NULL DEFAULT 0.00,
    `note` VARCHAR(255) NULL DEFAULT NULL,
    PRIMARY KEY (`staff_number`),
    KEY `idx_employee_pickup_point_index` (`pickup_point_index`),
    KEY `idx_employee_position_name` (`position_name`),
    CHECK (`staff_number` > 0),
    CHECK (`allowance` >= 0),
    CONSTRAINT `fk_employee_pickup_point`
        FOREIGN KEY (`pickup_point_index`) REFERENCES `pickup_point` (`pickup_point_index`),
    CONSTRAINT `fk_employee_position`
        FOREIGN KEY (`position_name`) REFERENCES `position` (`position_name`)
);

-- 5. Тариф
CREATE TABLE `tariff` (
    `tariff_code` INT UNSIGNED NOT NULL,
    `tariff_up_to_500g` DECIMAL(10,2) NOT NULL,
    `tariff_up_to_1kg` DECIMAL(10,2) NOT NULL,
    `additional_500g_charge` DECIMAL(10,2) NOT NULL,
    `oversize_surcharge` DECIMAL(10,2) NOT NULL,
    `careful_surcharge` DECIMAL(10,2) NOT NULL,
    `max_weight` DECIMAL(10,2) NOT NULL,
    `tariff_start_date` DATE NOT NULL,
    PRIMARY KEY (`tariff_code`),
    KEY `idx_tariff_start_date` (`tariff_start_date`),
    CHECK (`tariff_code` > 0),
    CHECK (`tariff_up_to_500g` >= 0),
    CHECK (`tariff_up_to_1kg` >= 0),
    CHECK (`additional_500g_charge` >= 0),
    CHECK (`oversize_surcharge` >= 0),
    CHECK (`careful_surcharge` >= 0),
    CHECK (`max_weight` > 0)
);

-- 6. Услуга
CREATE TABLE `service` (
    `service_name` VARCHAR(100) NOT NULL,
    `service_category` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`service_name`)
);

-- 7. Отправление
CREATE TABLE `shipment` (
    `ipo` CHAR(14) NOT NULL,
    `sender_passport_number` CHAR(10) NOT NULL,
    `receiver_passport_number` CHAR(10) NOT NULL,
    `staff_number` INT UNSIGNED NOT NULL,
    `pickup_point_index` CHAR(6) NOT NULL,
    `tariff_code` INT UNSIGNED NOT NULL,
    `package_type` ENUM('Стандарт', 'EMS', 'Экспресс') NOT NULL,
    `actual_weight` DECIMAL(10,2) NOT NULL,
    `volumetric_weight` DECIMAL(10,2) NOT NULL,
    `length_cm` INT NOT NULL,
    `width_cm` INT NOT NULL,
    `height_cm` INT NOT NULL,
    `declared_value` DECIMAL(10,2) NULL DEFAULT NULL,
    `service_cost` DECIMAL(10,2) NOT NULL,
    `additional_service_cost` DECIMAL(10,2) NULL DEFAULT NULL,
    `total_payable` DECIMAL(10,2) NOT NULL,
    `registration_date` DATE NOT NULL,
    `shipment_status` ENUM('Принято', 'В пути', 'Готова к выдаче', 'Выдана', 'Не востребована', 'Утилизирована') NOT NULL DEFAULT 'Принято',
    PRIMARY KEY (`ipo`),
    KEY `idx_shipment_sender_passport` (`sender_passport_number`),
    KEY `idx_shipment_receiver_passport` (`receiver_passport_number`),
    KEY `idx_shipment_staff_number` (`staff_number`),
    KEY `idx_shipment_pickup_point_index` (`pickup_point_index`),
    KEY `idx_shipment_tariff_code` (`tariff_code`),
    KEY `idx_shipment_status` (`shipment_status`),
    CHECK (`actual_weight` > 0),
    CHECK (`volumetric_weight` > 0),
    CHECK (`length_cm` > 0),
    CHECK (`width_cm` > 0),
    CHECK (`height_cm` > 0),
    CHECK (`declared_value` >= 0),
    CHECK (`service_cost` >= 0),
    CHECK (`additional_service_cost` >= 0),
    CHECK (`total_payable` >= 0),
    CONSTRAINT `fk_shipment_sender_client`
        FOREIGN KEY (`sender_passport_number`) REFERENCES `client` (`passport_number`),
    CONSTRAINT `fk_shipment_receiver_client`
        FOREIGN KEY (`receiver_passport_number`) REFERENCES `client` (`passport_number`),
    CONSTRAINT `fk_shipment_employee`
        FOREIGN KEY (`staff_number`) REFERENCES `employee` (`staff_number`),
    CONSTRAINT `fk_shipment_pickup_point`
        FOREIGN KEY (`pickup_point_index`) REFERENCES `pickup_point` (`pickup_point_index`),
    CONSTRAINT `fk_shipment_tariff`
        FOREIGN KEY (`tariff_code`) REFERENCES `tariff` (`tariff_code`)
);

-- 8. Особый график работы
CREATE TABLE `special_schedule` (
    `pickup_point_index` CHAR(6) NOT NULL,
    `schedule_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `note` VARCHAR(255) NULL DEFAULT NULL,
    PRIMARY KEY (`pickup_point_index`, `schedule_date`),
    CONSTRAINT `fk_special_schedule_pickup_point`
        FOREIGN KEY (`pickup_point_index`) REFERENCES `pickup_point` (`pickup_point_index`)
);

-- 9. Услуги пункта
CREATE TABLE `pickup_point_service` (
    `pickup_point_index` CHAR(6) NOT NULL,
    `service_name` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`pickup_point_index`, `service_name`),
    CONSTRAINT `fk_pickup_point_service_pickup_point`
        FOREIGN KEY (`pickup_point_index`) REFERENCES `pickup_point` (`pickup_point_index`),
    CONSTRAINT `fk_pickup_point_service_service`
        FOREIGN KEY (`service_name`) REFERENCES `service` (`service_name`)
);

-- 10. Опись отправления
CREATE TABLE `shipment_inventory` (
    `ipo` CHAR(14) NOT NULL,
    `item_no` INT NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `item_count` INT NOT NULL,
    `declared_value_per_unit` DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (`ipo`, `item_no`),
    CHECK (`item_no` > 0),
    CHECK (`item_count` > 0),
    CHECK (`declared_value_per_unit` >= 0),
    CONSTRAINT `fk_shipment_inventory_shipment`
        FOREIGN KEY (`ipo`) REFERENCES `shipment` (`ipo`)
);

-- 11. Квитанция о приеме отправления
CREATE TABLE `receipt` (
    `ipo` CHAR(14) NOT NULL,
    `cash_register_number` VARCHAR(15) NOT NULL,
    `shift_number` INT NOT NULL,
    `staff_number` INT UNSIGNED NOT NULL,
    `shipping_method` VARCHAR(100) NOT NULL,
    `operation_date` DATE NOT NULL,
    `operation_time` TIME NOT NULL,
    PRIMARY KEY (`ipo`),
    KEY `idx_receipt_staff_number` (`staff_number`),
    KEY `idx_receipt_operation_date` (`operation_date`),
    CHECK (`shift_number` BETWEEN 1 AND 9999),
    CONSTRAINT `fk_receipt_shipment`
        FOREIGN KEY (`ipo`) REFERENCES `shipment` (`ipo`),
    CONSTRAINT `fk_receipt_employee`
        FOREIGN KEY (`staff_number`) REFERENCES `employee` (`staff_number`)
);

-- 12. Акт приема-передачи
CREATE TABLE `transfer_act` (
    `act_number` INT UNSIGNED NOT NULL,
    `creation_date` DATE NOT NULL,
    `sender_staff_number` INT UNSIGNED NOT NULL,
    `receiver_staff_number` INT UNSIGNED NOT NULL,
    `total_shipments` INT NOT NULL,
    PRIMARY KEY (`act_number`),
    KEY `idx_transfer_act_sender_staff` (`sender_staff_number`),
    KEY `idx_transfer_act_receiver_staff` (`receiver_staff_number`),
    KEY `idx_transfer_act_creation_date` (`creation_date`),
    CHECK (`act_number` BETWEEN 1 AND 999999),
    CHECK (`total_shipments` > 0),
    CONSTRAINT `fk_transfer_act_sender_employee`
        FOREIGN KEY (`sender_staff_number`) REFERENCES `employee` (`staff_number`),
    CONSTRAINT `fk_transfer_act_receiver_employee`
        FOREIGN KEY (`receiver_staff_number`) REFERENCES `employee` (`staff_number`)
);

-- 13. Состав акта
CREATE TABLE `transfer_act_content` (
    `act_number` INT UNSIGNED NOT NULL,
    `item_no` INT NOT NULL,
    `ipo` CHAR(14) NOT NULL,
    PRIMARY KEY (`act_number`, `item_no`),
    UNIQUE KEY `uk_transfer_act_content_ipo` (`ipo`),
    CHECK (`item_no` > 0),
    CONSTRAINT `fk_transfer_act_content_act`
        FOREIGN KEY (`act_number`) REFERENCES `transfer_act` (`act_number`),
    CONSTRAINT `fk_transfer_act_content_shipment`
        FOREIGN KEY (`ipo`) REFERENCES `shipment` (`ipo`)
);
