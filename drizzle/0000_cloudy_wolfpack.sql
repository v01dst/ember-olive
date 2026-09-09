CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`item_id` text NOT NULL,
	`name` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`notes` text,
	`total_cents` integer NOT NULL,
	`eta_minutes` integer DEFAULT 20 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`party_size` integer NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
