-- PHIEN-081: System Settings singleton.
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `reservation_ttl_minutes` INTEGER UNSIGNED NOT NULL DEFAULT 15,
    `complaint_window_days` INTEGER UNSIGNED NOT NULL DEFAULT 7,
    `near_expiry_threshold_days` INTEGER UNSIGNED NOT NULL DEFAULT 7,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `system_settings` (
    `id`,
    `reservation_ttl_minutes`,
    `complaint_window_days`,
    `near_expiry_threshold_days`,
    `updated_at`
) VALUES (1, 15, 7, 7, CURRENT_TIMESTAMP(3));
