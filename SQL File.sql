-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 09, 2025 at 10:04 PM
-- Server version: 10.6.20-MariaDB-cll-lve
-- PHP Version: 8.3.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `egpayio_pay`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `ip` varchar(50) NOT NULL,
  `activity` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `uid`, `ip`, `activity`, `created_at`) VALUES
(58, 357, '103.115.24.239', 'Signin', '2025-03-11 04:49:30'),
(59, 358, '103.148.52.244', 'Signin', '2025-03-11 20:16:53'),
(60, 358, '180.148.213.124', 'Signin', '2025-03-12 14:35:12'),
(61, 358, '180.148.213.124', 'Signin', '2025-03-13 13:40:53'),
(62, 358, '180.148.213.124', 'Signin', '2025-03-13 13:50:55'),
(63, 359, '103.25.251.236', 'Signin', '2025-03-13 20:38:25'),
(64, 358, '103.148.52.244', 'Signin', '2025-03-13 23:01:55'),
(65, 358, '103.148.52.244', 'Signin', '2025-03-14 16:46:14'),
(66, 358, '103.148.52.242', 'Signin', '2025-03-17 04:05:57'),
(67, 360, '103.121.217.60', 'Signin', '2025-03-18 01:16:11'),
(68, 358, '103.148.52.242', 'Signin', '2025-03-18 05:39:32'),
(70, 362, '103.112.56.237', 'Signin', '2025-05-09 21:41:18'),
(71, 363, '103.67.65.97', 'Signin', '2025-05-09 21:45:17');

-- --------------------------------------------------------

--
-- Table structure for table `addons`
--

CREATE TABLE `addons` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `unique_identifier` varchar(50) DEFAULT NULL,
  `version` varchar(50) DEFAULT NULL,
  `price` decimal(10,3) NOT NULL DEFAULT 0.000,
  `status` int(2) NOT NULL DEFAULT 1,
  `image` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_activity_logs`
--

CREATE TABLE `admin_activity_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `ip` varchar(50) NOT NULL,
  `activity` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_activity_logs`
--

INSERT INTO `admin_activity_logs` (`id`, `uid`, `ip`, `activity`, `created_at`, `deleted_at`) VALUES
(67, 1, '103.148.52.244', 'Login', '2025-03-11 04:08:52', NULL),
(68, 1, '103.148.52.244', 'Login', '2025-03-11 04:59:40', NULL),
(69, 1, '180.148.213.124', 'Login', '2025-03-11 08:24:54', NULL),
(70, 1, '180.148.213.124', 'The was created-admin@gmail.com', '2025-03-11 08:25:39', NULL),
(71, 1, '103.148.52.244', 'Login', '2025-03-11 20:06:39', NULL),
(72, 1, '103.148.52.244', 'Login', '2025-03-11 20:14:16', NULL),
(73, 1, '103.148.52.244', 'The was created-asfv@gmail.com', '2025-03-11 20:15:17', NULL),
(74, 1, '103.148.52.244', 'Bulk user delete', '2025-03-11 20:15:28', NULL),
(75, 1, '103.148.52.242', 'Login', '2025-03-16 20:27:41', NULL),
(76, 1, '103.16.226.153', 'Login', '2025-03-17 06:19:14', NULL),
(77, 1, '180.148.213.124', 'Login', '2025-03-17 15:20:19', NULL),
(78, 1, '37.111.206.195', 'Login', '2025-03-17 17:18:05', NULL),
(79, 1, '103.134.124.20', 'Login', '2025-03-17 17:49:06', NULL),
(80, 1, '37.111.206.195', 'Login', '2025-03-18 03:58:00', NULL),
(81, 1, '103.148.52.242', 'Login', '2025-03-18 05:37:50', NULL),
(82, 1, '103.112.56.237', 'Login', '2025-05-09 21:51:53', NULL),
(83, 1, '103.112.56.237', 'The was created-admin@gmail.com', '2025-05-09 21:52:37', NULL),
(84, 1, '42.0.6.228', 'Login', '2025-05-09 21:54:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `affiliates`
--

CREATE TABLE `affiliates` (
  `id` int(10) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `ref_id` int(10) UNSIGNED NOT NULL,
  `amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_transaction_logs`
--

CREATE TABLE `bank_transaction_logs` (
  `id` int(11) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `brand_id` int(10) DEFAULT NULL,
  `files` text DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=pending,1=initiated,2=success,3=cancel',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` text DEFAULT NULL,
  `thumbnail` text DEFAULT NULL,
  `uri` text DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `id` int(10) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `domain` text DEFAULT NULL,
  `ip` text DEFAULT NULL,
  `brand_name` varchar(30) DEFAULT NULL,
  `brand_key` text DEFAULT NULL,
  `brand_logo` text DEFAULT NULL,
  `meta` text DEFAULT NULL,
  `fees` decimal(10,3) NOT NULL DEFAULT 0.000,
  `fees_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=flat,1=percent',
  `currency` varchar(20) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=inactive,1=active',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `uid`, `domain`, `ip`, `brand_name`, `brand_key`, `brand_logo`, `meta`, `fees`, `fees_type`, `currency`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(8, 1, 'bdbetterpay.com', '103.159.37.122', 'BD Better Pay', '8QFIJJNzDGGw1qmhdCJcK5xcvuh8PwRXviUfDlLatVhgkjXlZv', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1734967288_00c5211fea2e14b14555.jpg', '{\"mobile_number\":\"01711991935\",\"whatsapp_number\":\"01711991935\",\"support_mail\":\"tuktakpay@gmail.com\"}', 0.000, 0, NULL, 1, '2024-12-07 11:20:51', '2025-03-11 00:04:26', NULL),
(19, 358, 'hostreset.com', '103.148.52.244', 'Hostreset', 'fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04', 'public/uploads/user/abf749051d8b000946c71a2e216e55eeb49cf414/1741702704_8bb04122ef73501a7879.png', '{\"mobile_number\":\"01710604946\",\"whatsapp_number\":\"01710604946\",\"support_mail\":\"info@hostreset.com\"}', 1.000, 0, NULL, 1, '2025-03-11 20:18:37', '2025-03-13 14:00:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) UNSIGNED NOT NULL,
  `code` varchar(191) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `price` double NOT NULL,
  `times` varchar(191) DEFAULT NULL,
  `used` int(191) UNSIGNED NOT NULL DEFAULT 0,
  `param` text NOT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

CREATE TABLE `devices` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `user_email` text NOT NULL,
  `device_name` text NOT NULL,
  `device_key` text NOT NULL,
  `device_ip` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `devices`
--

INSERT INTO `devices` (`id`, `uid`, `user_email`, `device_name`, `device_key`, `device_ip`, `created_at`, `updated_at`, `deleted_at`) VALUES
(14, 1, 'admin@gmail.com', 'Relme8', 'fVSARTobNKvglddV9QhKlPFTsFcLUD884mmh1wjg', NULL, '2025-03-11 20:15:22', NULL, NULL),
(15, 358, 'bdbosstv@gmail.com', 'teste', 'hFKo7yB5Fg27PKLxT5hmi9xi1Wx3Zp6ZqPEm5zEh', '264c0fcca9e4a792', '2025-03-11 20:18:50', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` int(11) UNSIGNED NOT NULL,
  `question` text DEFAULT NULL,
  `answer` longtext DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `sort`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'What is TukTak Pay', 'Tuktak Pay: Transforming Transactions through Technology\r\nTuktak Pay is a powerful yet easy to utilize digital solution created to streamline business exchanges. Leveraging individual accounts as gateways, it guarantees adaptability, protection, and simplicity of use. Here are the ways Tuktak Pay can change your operations:\r\nEffortless Customer Settlements:\r\nWith Tuktak Pay, enterprises can effortlessly approve installments specifically through their sites, improving client benefit. Its configurable settings support diverse payment options including recurring payments and subscriptions.\r\nProgrammatic Integration for Productivity:\r\nIncorporate Tuktak Pay\\\'s strong API into your framework for smooth exchange administration. Its flexible design interfaces seamlessly with a wide range of platforms to automate workflows and reconcile funds with minimal human intervention.\r\nSecurity You Can Depend On:\r\nEach exchange is encrypted and checked to give a sheltered condition, guaranteeing client trust and information honesty. Multi-factor authentication and automatic fraud detection further fortify the protection of sensitive consumer data.\r\nFor Organizations of All Sizes:\r\nWhether you\\\'re a small new company or a large association, Tuktak Pay changes as indicated by your needs, empowering development and making monetary cycles intuitive.\r\nBegin your excursion with Tuktak Pay and redesign how your business deals with installments.', 1, 1, '2024-12-18 22:29:47', '2024-12-18 22:29:47', NULL),
(2, 'Is TukTak Pay a Safe Option for Businesses ?', 'TukTak Pay: The Safe and Reliable Payment Option!\r\nTukTak Pay ensures every transaction is secured and reliable &mdash; making it a great choice for businesses needing the best financial protection. Here\\\'s why you can trust it :\r\nAdvanced Encryption Protocols\r\nTukTak Pay employs military-grade encryption to protect sensitive transactional data, maintaining the privacy of your customers.\r\nFraud Detection Systems\r\nScalable with integrated fraud detection, TukTak Pay identifies and blocks suspicious activities for the peace of mind of the business.\r\nInternational standard compliance\r\nTukTak Pay complies with international security frameworks, including PCI DSS, to ensure its compliance with industry standards for secure payment processing.\r\nIntegration without compromise with strong security\r\nTukTak Pay is user-friendly and easy to integrate, yet it still never sacrifices safety, helping businesses of all sizes.\r\nTukTak Pay caters the necessities of startups and enterprise businesses with an emphasis on security, efficiency, and reliability.', 2, 1, '2024-12-18 22:46:17', '2024-12-18 22:46:17', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `file_managers`
--

CREATE TABLE `file_managers` (
  `id` int(9) NOT NULL,
  `uid` int(11) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `file_managers`
--

INSERT INTO `file_managers` (`id`, `uid`, `file_name`, `file_url`, `file_type`, `file_size`, `created_at`) VALUES
(2, 88, '1728398628_942e8c07e19cebba1673.jpg', 'public/uploads/user/b37f6ddcefad7e8657837d3177f9ef2462f98acf/1728398628_942e8c07e19cebba1673.jpg', 'image/jpeg', 103221, '2024-10-08 20:43:48'),
(3, 88, '1728398658_5e037cadedaa9ddc5395.jpg', 'public/uploads/user/b37f6ddcefad7e8657837d3177f9ef2462f98acf/1728398658_5e037cadedaa9ddc5395.jpg', 'image/jpeg', 10263, '2024-10-08 20:44:18'),
(4, 0, '1728399479_b7d73f35726d9e4310b5.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1728399479_b7d73f35726d9e4310b5.png', 'image/png', 80596, '2024-10-08 20:57:59'),
(5, 0, '1728399488_b64c3407b15836b97fd5.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1728399488_b64c3407b15836b97fd5.png', 'image/png', 102502, '2024-10-08 20:58:08'),
(6, 0, '1728399559_9cd8914214b745521876.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1728399559_9cd8914214b745521876.png', 'image/png', 80596, '2024-10-08 20:59:19'),
(7, 0, '1728399564_a0c7c02fd5a00d7ad426.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1728399564_a0c7c02fd5a00d7ad426.png', 'image/png', 80596, '2024-10-08 20:59:24'),
(8, 6, '1728400816_efcb28e5a8242c8caa78.png', 'public/uploads/user/c1dfd96eea8cc2b62785275bca38ac261256e278/1728400816_efcb28e5a8242c8caa78.png', 'image/png', 80596, '2024-10-08 21:20:16'),
(9, 1, '1728403939_dfba68933fe40076ad85.jpg', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1728403939_dfba68933fe40076ad85.jpg', 'image/jpeg', 14158, '2024-10-08 22:12:19'),
(10, 0, '1728409631_b500be3dd669fbf6579e.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1728409631_b500be3dd669fbf6579e.png', 'image/png', 80596, '2024-10-08 23:47:11'),
(11, 0, '1728410037_9239d6c1bae86f22c973.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1728410037_9239d6c1bae86f22c973.png', 'image/png', 80596, '2024-10-08 23:53:57'),
(12, 6, '1728459782_00c5b6202549db3b7ba4.jpg', 'public/uploads/user/c1dfd96eea8cc2b62785275bca38ac261256e278/1728459782_00c5b6202549db3b7ba4.jpg', 'image/jpeg', 39655, '2024-10-09 13:43:02'),
(13, 179, '1728478783_ac6316caf55f369ce3ca.jpeg', 'public/uploads/user/9e44d2771c052d44058245eda6cb334689ca78cc/1728478783_ac6316caf55f369ce3ca.jpeg', 'image/jpeg', 7603, '2024-10-09 18:59:43'),
(14, 185, '1728496161_d0d07ad08a7d6af8a376.jpg', 'public/uploads/user/cfa2ed2aac6d61f44ca9cba73e1e8946b7cd7d22/1728496161_d0d07ad08a7d6af8a376.jpg', 'image/jpeg', 46179, '2024-10-09 23:49:21'),
(15, 185, '1728496198_3630522c5e47f2c5d0ae.png', 'public/uploads/user/cfa2ed2aac6d61f44ca9cba73e1e8946b7cd7d22/1728496198_3630522c5e47f2c5d0ae.png', 'image/png', 12578, '2024-10-09 23:49:58'),
(16, 185, '1728496406_66492203136fe6c36375.jpg', 'public/uploads/user/cfa2ed2aac6d61f44ca9cba73e1e8946b7cd7d22/1728496406_66492203136fe6c36375.jpg', 'image/jpeg', 17945, '2024-10-09 23:53:26'),
(17, 88, '1728625532_c736bb50a36ff775b6b3.jpg', 'public/uploads/user/b37f6ddcefad7e8657837d3177f9ef2462f98acf/1728625532_c736bb50a36ff775b6b3.jpg', 'image/jpeg', 9848, '2024-10-11 11:45:32'),
(18, 294, '1728912198_9b860d2f3c72bd2ba023.png', 'public/uploads/user/3a085d1bc5fa41313c4e0910e7341af761b0f7db/1728912198_9b860d2f3c72bd2ba023.png', 'image/png', 14217, '2024-10-14 19:23:18'),
(19, 294, '1728912321_ca1ae7710241735b3281.png', 'public/uploads/user/3a085d1bc5fa41313c4e0910e7341af761b0f7db/1728912321_ca1ae7710241735b3281.png', 'image/png', 14217, '2024-10-14 19:25:21'),
(20, 88, '1729093736_5fc766c9b99212298c52.png', 'public/uploads/user/b37f6ddcefad7e8657837d3177f9ef2462f98acf/1729093736_5fc766c9b99212298c52.png', 'image/png', 14217, '2024-10-16 21:48:56'),
(21, 88, '1729093831_fa933efbff64b7e36225.png', 'public/uploads/user/b37f6ddcefad7e8657837d3177f9ef2462f98acf/1729093831_fa933efbff64b7e36225.png', 'image/png', 14217, '2024-10-16 21:50:31'),
(22, 295, '1729094239_8e2d65a6eb177299cf19.png', 'public/uploads/user/a02b857f2eff73e8e188f35529dd91f8144b23b9/1729094239_8e2d65a6eb177299cf19.png', 'image/png', 353311, '2024-10-16 21:57:19'),
(23, 295, '1729094469_32a8993e4621be4b1de4.png', 'public/uploads/user/a02b857f2eff73e8e188f35529dd91f8144b23b9/1729094469_32a8993e4621be4b1de4.png', 'image/png', 14217, '2024-10-16 22:01:09'),
(24, 298, '1729386388_9d7da5a470559431441d.jpg', 'public/uploads/user/eb65e208b715d3b42fc535aebcd8d3e7fb5f2c94/1729386388_9d7da5a470559431441d.jpg', 'image/jpeg', 125565, '2024-10-20 07:06:28'),
(25, 300, '1729618566_ebbbf94a1463ae0457c8.png', 'public/uploads/user/e26973e6ee8ab9cd8cb3f207d1b90f00d2669eff/1729618566_ebbbf94a1463ae0457c8.png', 'image/png', 405464, '2024-10-22 23:36:06'),
(26, 0, '1730479999_b87e7dfe94351beeb59e.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1730479999_b87e7dfe94351beeb59e.jpg', 'image/jpeg', 14158, '2024-11-01 22:53:19'),
(27, 0, '1730480029_aa524a469f5d2c7b0c86.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1730480029_aa524a469f5d2c7b0c86.jpg', 'image/jpeg', 14158, '2024-11-01 22:53:49'),
(28, 1, '1730595824_0af2130ffb3c7e904904.png', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1730595824_0af2130ffb3c7e904904.png', 'image/png', 80596, '2024-11-03 07:03:44'),
(29, 0, '1732982962_ab1f3d84fa63112c3ca6.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1732982962_ab1f3d84fa63112c3ca6.png', 'image/png', 5774, '2024-11-30 22:09:22'),
(30, 0, '1732982998_9ce2a923f99cd8fc2195.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1732982998_9ce2a923f99cd8fc2195.png', 'image/png', 5774, '2024-11-30 22:09:58'),
(31, 0, '1733031584_41825073b1b771dca6c4.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1733031584_41825073b1b771dca6c4.png', 'image/png', 9299, '2024-12-01 11:39:44'),
(32, 0, '1733031830_6e41fa51d1d9b0bcd847.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1733031830_6e41fa51d1d9b0bcd847.png', 'image/png', 76912, '2024-12-01 11:43:50'),
(33, 0, '1733031856_50b153c4d9ae66b5a156.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1733031856_50b153c4d9ae66b5a156.png', 'image/png', 76912, '2024-12-01 11:44:16'),
(34, 0, '1733031863_d0f67e662a5079f004eb.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1733031863_d0f67e662a5079f004eb.png', 'image/png', 9299, '2024-12-01 11:44:23'),
(35, 0, '1733114332_81e7abc3de6e2f6ae2b0.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1733114332_81e7abc3de6e2f6ae2b0.png', 'image/png', 34218, '2024-12-02 10:38:52'),
(36, 1, '1733208458_d74f2aea85f7ca40742d.png', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1733208458_d74f2aea85f7ca40742d.png', 'image/png', 34218, '2024-12-03 12:47:38'),
(37, 305, '1733548847_ac6a1016655add94c3fa.png', 'public/uploads/user/9a3d6127374af09c22015bf3ede3ac00a36e3ec6/1733548847_ac6a1016655add94c3fa.png', 'image/png', 76912, '2024-12-07 11:20:47'),
(38, 1, '1734176170_0f063d499294a3f1e5ac.png', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1734176170_0f063d499294a3f1e5ac.png', 'image/png', 4190, '2024-12-14 17:36:10'),
(39, 1, '1734176397_89fe00dfab5b71abc250.png', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1734176397_89fe00dfab5b71abc250.png', 'image/png', 6974, '2024-12-14 17:39:57'),
(40, 0, '1734517490_3e85a09031251cde25cc.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734517490_3e85a09031251cde25cc.jpg', 'image/jpeg', 11813, '2024-12-18 16:24:50'),
(41, 0, '1734517520_ce360fd376246a408ee2.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734517520_ce360fd376246a408ee2.jpg', 'image/jpeg', 11813, '2024-12-18 16:25:20'),
(42, 0, '1734518091_54e0507c3f49114cec5c.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734518091_54e0507c3f49114cec5c.jpg', 'image/jpeg', 22993, '2024-12-18 16:34:51'),
(43, 0, '1734518168_ace641b4ec9c9209f648.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734518168_ace641b4ec9c9209f648.png', 'image/png', 47608, '2024-12-18 16:36:08'),
(44, 0, '1734518179_cd2492593a529e11a746.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734518179_cd2492593a529e11a746.jpg', 'image/jpeg', 17921, '2024-12-18 16:36:19'),
(45, 0, '1734519128_69d5a090b9b3df244e02.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734519128_69d5a090b9b3df244e02.jpg', 'image/jpeg', 17921, '2024-12-18 16:52:08'),
(46, 0, '1734519891_d9639631de1634bf18bc.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734519891_d9639631de1634bf18bc.png', 'image/png', 47608, '2024-12-18 17:04:51'),
(47, 340, '1734542607_1ab17fcc7244e31abc31.jpg', 'public/uploads/user/3e6bf6c89ba8a8b8b189f85975b0fab42bdc6d4a/1734542607_1ab17fcc7244e31abc31.jpg', 'image/jpeg', 69631, '2024-12-18 23:23:27'),
(48, 340, '1734542972_2d014fde6f86d13e69b0.png', 'public/uploads/user/3e6bf6c89ba8a8b8b189f85975b0fab42bdc6d4a/1734542972_2d014fde6f86d13e69b0.png', 'image/png', 315707, '2024-12-18 23:29:33'),
(49, 0, '1734614289_262d9fd2c01e2ebc4719.jpg', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734614289_262d9fd2c01e2ebc4719.jpg', 'image/jpeg', 17433, '2024-12-19 19:18:09'),
(50, 0, '1734614395_c0c3762ef72a251de9e6.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734614395_c0c3762ef72a251de9e6.png', 'image/png', 53445, '2024-12-19 19:19:55'),
(51, 340, '1734937992_329284fb1bf938ea2987.png', 'public/uploads/user/3e6bf6c89ba8a8b8b189f85975b0fab42bdc6d4a/1734937992_329284fb1bf938ea2987.png', 'image/png', 18841, '2024-12-23 13:13:12'),
(52, 340, '1734938769_a6de23117d04d5c4f0ec.png', 'public/uploads/user/3e6bf6c89ba8a8b8b189f85975b0fab42bdc6d4a/1734938769_a6de23117d04d5c4f0ec.png', 'image/png', 18841, '2024-12-23 13:26:09'),
(53, 0, '1734947867_4e920b1c6db0a27cf27a.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734947867_4e920b1c6db0a27cf27a.png', 'image/png', 121805, '2024-12-23 15:57:47'),
(54, 1, '1734967288_00c5211fea2e14b14555.jpg', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1734967288_00c5211fea2e14b14555.jpg', 'image/jpeg', 11375, '2024-12-23 21:21:28'),
(55, 1, '1734967698_8eb8fbaa63941124dc8e.jpg', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1734967698_8eb8fbaa63941124dc8e.jpg', 'image/jpeg', 55107, '2024-12-23 21:28:18'),
(56, 341, '1735011486_4801ce974c04db55cb75.jpg', 'public/uploads/user/8da4dabfaeb4a44681c9777c85db39140e3e12e6/1735011486_4801ce974c04db55cb75.jpg', 'image/jpeg', 15878, '2024-12-24 09:38:06'),
(57, 343, '1735013786_0cc23734a29f647625ba.jpg', 'public/uploads/user/25a5e3012854728e0c6ab97fdcbb65c3a00c0965/1735013786_0cc23734a29f647625ba.jpg', 'image/jpeg', 68916, '2024-12-24 10:16:26'),
(58, 343, '1735034795_4e4dddbf25a737e06538.jpg', 'public/uploads/user/25a5e3012854728e0c6ab97fdcbb65c3a00c0965/1735034795_4e4dddbf25a737e06538.jpg', 'image/jpeg', 55107, '2024-12-24 16:06:35'),
(59, 344, '1735091568_9970f2d6c58fe5ba9c4e.jpg', 'public/uploads/user/640bacfb48aefac1f91028c01603e5c78d4f63ca/1735091568_9970f2d6c58fe5ba9c4e.jpg', 'image/jpeg', 64520, '2024-12-25 07:52:48'),
(60, 345, '1735100654_556d77316b63cdccf145.jpg', 'public/uploads/user/35139ef894b28b73bea022755166a23933c7d9cb/1735100654_556d77316b63cdccf145.jpg', 'image/jpeg', 55107, '2024-12-25 10:24:14'),
(61, 344, '1735120914_d1a3a6585c0af53167e9.jpg', 'public/uploads/user/640bacfb48aefac1f91028c01603e5c78d4f63ca/1735120914_d1a3a6585c0af53167e9.jpg', 'image/jpeg', 64520, '2024-12-25 16:01:54'),
(62, 344, '1735121112_56db2aed8e2e08edfe31.jpg', 'public/uploads/user/640bacfb48aefac1f91028c01603e5c78d4f63ca/1735121112_56db2aed8e2e08edfe31.jpg', 'image/jpeg', 64520, '2024-12-25 16:05:12'),
(63, 309, '1735189800_9eb8731cad43175badc8.jpg', 'public/uploads/user/ed2efc1c05342a60c2198a5e96773a237008956b/1735189800_9eb8731cad43175badc8.jpg', 'image/jpeg', 149719, '2024-12-26 11:10:00'),
(64, 351, '1735458685_c0889c215fe1b81901a9.png', 'public/uploads/user/0026476a20bfbd08714155bb66f0b4feb2d25c1c/1735458685_c0889c215fe1b81901a9.png', 'image/png', 53269, '2024-12-29 13:51:25'),
(65, 352, '1735568726_c731b945f81cc65167a0.png', 'public/uploads/user/efbc0848b836a9de4b0c18c93ec052d87647fb06/1735568726_c731b945f81cc65167a0.png', 'image/png', 19341, '2024-12-30 20:25:26'),
(66, 309, '1735835221_52dd0ee3e1252e277692.jpg', 'public/uploads/user/ed2efc1c05342a60c2198a5e96773a237008956b/1735835221_52dd0ee3e1252e277692.jpg', 'image/jpeg', 68306, '2025-01-02 22:27:01'),
(67, 358, '1741702704_8bb04122ef73501a7879.png', 'public/uploads/user/abf749051d8b000946c71a2e216e55eeb49cf414/1741702704_8bb04122ef73501a7879.png', 'image/png', 390361, '2025-03-11 20:18:25'),
(68, 1, '1746806013_f5bd82cfd5cec3190852.png', 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1746806013_f5bd82cfd5cec3190852.png', 'image/png', 8337, '2025-05-09 21:53:33'),
(69, 0, '1746806453_631eb05aa9d55be8506e.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1746806453_631eb05aa9d55be8506e.png', 'image/png', 8337, '2025-05-09 22:00:53'),
(70, 0, '1746806477_ff79c3408aab1c2f22f0.png', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1746806477_ff79c3408aab1c2f22f0.png', 'image/png', 8337, '2025-05-09 22:01:17');

-- --------------------------------------------------------

--
-- Table structure for table `invoice`
--

CREATE TABLE `invoice` (
  `id` int(11) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `customer_name` text NOT NULL,
  `customer_number` text DEFAULT NULL,
  `customer_amount` text NOT NULL,
  `customer_email` text NOT NULL,
  `customer_address` text NOT NULL,
  `customer_description` text DEFAULT NULL,
  `status` int(11) NOT NULL,
  `pay_status` int(4) NOT NULL,
  `brand_id` text DEFAULT NULL,
  `transaction_id` text DEFAULT NULL,
  `extras` text DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice`
--

INSERT INTO `invoice` (`id`, `ids`, `uid`, `customer_name`, `customer_number`, `customer_amount`, `customer_email`, `customer_address`, `customer_description`, `status`, `pay_status`, `brand_id`, `transaction_id`, `extras`, `created_at`, `deleted_at`) VALUES
(17, '9547f957938e1166cc015eb3d91e9db8', 358, 'AAA', '01710604946', '777', 'a@app.com', 'asdasd', 'dsfdsfs', 1, 0, '19', NULL, NULL, '2025-03-18 05:41:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kyc`
--

CREATE TABLE `kyc` (
  `id` int(11) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `params` text DEFAULT NULL,
  `status` int(2) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `version` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `group` varchar(255) NOT NULL,
  `namespace` varchar(255) NOT NULL,
  `time` int(11) NOT NULL,
  `batch` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `version`, `class`, `group`, `namespace`, `time`, `batch`) VALUES
(1, '2023-12-23-055313', 'Modules\\Blocks\\Database\\Migrations\\Queue', 'default', 'Blocks', 1733164861, 1),
(2, '2023-12-23-055313', 'Modules\\Home\\Database\\Migrations\\Settings', 'default', 'Home', 1733164862, 2),
(3, '2023-12-26-040632', 'Modules\\Home\\Database\\Migrations\\FileManager', 'default', 'Home', 1733164862, 2),
(4, '2023-12-27-012628', 'Modules\\Home\\Database\\Migrations\\Payments', 'default', 'Home', 1733164862, 2),
(5, '2024-04-30-042916', 'Modules\\Home\\Database\\Migrations\\Blogs', 'default', 'Home', 1733164862, 2),
(6, '2024-05-15-153103', 'Modules\\Home\\Database\\Migrations\\Addons', 'default', 'Home', 1733164862, 2);

-- --------------------------------------------------------

--
-- Table structure for table `module_data`
--

CREATE TABLE `module_data` (
  `id` int(10) UNSIGNED NOT NULL,
  `tmp_id` text DEFAULT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `message` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=pending,1=success',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `module_data`
--

INSERT INTO `module_data` (`id`, `tmp_id`, `uid`, `message`, `address`, `status`, `created_at`, `updated_at`) VALUES
(15, NULL, 358, 'You have received payment Tk 1,500.00 from 01329503432. Fee Tk 0.00. Balance Tk 1,506.40. TrxID CCE6L9KZ74 at 14/03/2025 20:27', 'bKash', 0, '2025-03-14 20:27:21', NULL),
(16, NULL, 358, 'You have received payment Tk 20.00 from 01783632964. Fee Tk 0.00. Balance Tk 1,526.40. TrxID CCE8LAW19U at 14/03/2025 21:13', 'bKash', 0, '2025-03-14 21:13:41', NULL),
(17, NULL, 358, 'TK 1,500.00 credited to A/C#10531**0001 on 14-03-25 @09:15 PM from OTHER BANK. Balance TK 4,047.24. BRAC Bank.', 'BRAC-BANK', 0, '2025-03-14 21:16:05', NULL),
(18, NULL, 358, 'আজকের অফার ৮০মিনিট ৫৫টাকা ৩০দিন ডায়াল *১২১*৩২০৪# https://mygp.li/oS3', 'GP80MIN55TK', 0, '2025-03-15 09:46:39', NULL),
(19, NULL, 358, 'আজ ৪জিবি ৯০টাকা ৭দিন। ডায়াল *১২১*৫৪৫০# বা https://mygp.li/Rt', 'GP4GB90TK7D', 0, '2025-03-15 10:08:09', NULL),
(20, NULL, 358, 'আজকের অফার! ৮জিবি ১০০টাকা ৩০দিন (১বার)! *১২১*৫০৭১# https://mygp.li/o9', 'GP8GB100TK', 0, '2025-03-15 12:50:30', NULL),
(21, NULL, 358, 'আজ ২জিবি ৪০টাকা ৭দিন। ডায়াল *১২১*৫১৮২# বা https://mygp.li/Xb', 'GP 2GB40TK', 0, '2025-03-16 08:17:39', NULL),
(22, NULL, 358, '৩৫৮টাকা ১৫জিবি+৩০০মিনিট ৩০দিন,ডায়াল *১২১*৫৩৫৮# বা https://mygp.li/3N8', 'GP Bundle', 0, '2025-03-16 11:45:41', NULL),
(23, NULL, 358, 'আজকের অফার! ৮জিবি ১০০টাকা ৩০দিন (১বার)! *১২১*৫০৭১# https://mygp.li/o9', 'GP8GB100TK', 0, '2025-03-16 12:36:25', NULL),
(24, NULL, 358, 'You have received payment Tk 2,000.00 from 01674962416. Fee Tk 0.00. Balance Tk 2,005.55. TrxID CCG1MIY18N at 16/03/2025 14:00', 'bKash', 0, '2025-03-16 14:00:44', NULL),
(25, NULL, 358, '৪জিবি + ১২৫মিনিট ১২৫ টাকা-৭দিন,ডায়াল *১২১*৫৫০৮# বা https://mygp.li/8M', 'GP Bundle', 0, '2025-03-17 09:50:08', NULL),
(26, NULL, 358, 'আজ ৪জিবি ৯০টাকা ৭দিন। ডায়াল *১২১*৫৪৫০# বা https://mygp.li/Rt', 'GP4GB90TK7D', 0, '2025-03-17 09:50:10', NULL),
(27, NULL, 358, 'আজকের অফার! ৮জিবি ১০০টাকা ৩০দিন (১বার)! *১২১*৫০৭১# https://mygp.li/o9', 'GP8GB100TK', 0, '2025-03-17 11:37:38', NULL),
(28, NULL, 358, 'TK 690.00 has been credited to your A/C# 10531**0001 on 17-03-25. Your A/C balance is TK 4,737.24. For Enquiry call: 16221', 'BRAC-BANK', 0, '2025-03-17 13:48:46', NULL),
(29, NULL, 358, 'TK 5,000.00 has been deposited to A/C#10531**0001 on 17-03-25 @01:53 PM at NARAYANGANJ CRM NARAYANGONJ BD. Balance TK 9,737.24. BRAC Bank.', 'BRAC-BANK', 0, '2025-03-17 13:53:15', NULL),
(30, NULL, 358, 'আপনি উপভোগ করছেন ১পয়সা/সেকেন্ড কলরেট, মেয়াদ ২৩ মার্চ ‘২৫ পর্যন্ত', 'GP1Poisha', 0, '2025-03-17 17:23:05', NULL),
(31, NULL, 358, 'TK 3,000.00 credited to A/C#10531**0001 on 17-03-25 @08:36 PM from OTHER BANK. Balance TK 12,737.24. BRAC Bank.', 'BRAC-BANK', 0, '2025-03-17 20:36:56', NULL),
(32, NULL, 358, 'You have received Tk 1,500.00 from M A supershopbd_01645007201 01645007201. Ref . Fee Tk 0.00. Balance Tk 3,505.55. TrxID CCH8NT2TIC at 17/03/2025 22:35', 'bKash', 0, '2025-03-17 22:35:59', NULL),
(33, NULL, 358, 'You have received payment Tk 1,400.00 from 01674962416. Ref bdpaymentgateway and sohelrasel. Fee Tk 0.00. Balance Tk 4,905.55. TrxID CCH9NTW41P at 17/03/2025 23:10', 'bKash', 0, '2025-03-17 23:10:10', NULL),
(34, NULL, 358, 'Send Money Tk 1,000.00 to 01969176234 successful. Ref . Fee Tk 5.00. Balance Tk 3,900.55. TrxID CCI6NWT2K0 at 18/03/2025 04:37', 'bKash', 0, '2025-03-18 04:38:02', NULL),
(35, NULL, 358, 'Cash Out Tk 1,256.30 to Habibur Telecom And Store_01323775746 01323775746 successful. Fee Tk 18.72. Balance Tk 2,625.53. TrxID CCI9O02Y6D at 18/03/2025 09:46', 'bKash', 0, '2025-03-18 09:46:56', NULL),
(36, NULL, 358, 'Merchant Payment Tk 1,938.00 to Ofaex It Solutions_01869430242 01869430242 successful. Ref . Fee Tk 3.88. Balance Tk 683.65. TrxID CCI0O173QE at 18/03/2025 10:23', 'bKash', 0, '2025-03-18 10:23:30', NULL),
(37, NULL, 358, 'আজকের অফার! ৮জিবি ১০০টাকা ৩০দিন (১বার)! *১২১*৫০৭১# https://mygp.li/o9', 'GP8GB100TK', 0, '2025-03-18 11:01:22', NULL),
(38, NULL, 358, '৩৫৮টাকা ১৫জিবি+৩০০মিনিট ৩০দিন,ডায়াল *১২১*৫৩৫৮# বা https://mygp.li/3N8', 'GP Bundle', 0, '2025-03-18 11:50:41', NULL),
(39, NULL, 358, 'আজকের অফার ৮০মিনিট ৫৫টাকা ৩০দিন ডায়াল *১২১*৩২০৪# https://mygp.li/oS3', 'GP80MIN55TK', 0, '2025-03-18 11:56:46', NULL),
(40, NULL, 358, 'আজ ২জিবি ৪০টাকা ৭দিন। ডায়াল *১২১*৫১৮২# বা https://mygp.li/Xb', 'GP 2GB40TK', 0, '2025-03-18 11:56:47', NULL),
(41, NULL, 358, 'You have received payment Tk 900.00 from 01674962416. Fee Tk 0.00. Balance Tk 1,583.65. TrxID CCI2O8HX6Y at 18/03/2025 13:47', 'bKash', 0, '2025-03-18 13:47:41', NULL),
(42, NULL, 358, 'Dear MD Leon  Islam, Your invoice #(invoiceid) was due on 17.03.2025 and is now overdue. Please make the payment at your earliest convenience to avoid service disruption. – HPLink DC  Let me know if you need any modifications! ????HPL DC', '+8809601003407', 0, '2025-03-18 15:00:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `admin_status` tinyint(1) NOT NULL DEFAULT 1,
  `is_admin_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `uid`, `message`, `is_read`, `admin_status`, `is_admin_read`, `created_at`) VALUES
(2, 357, 'Hi,Asdfgh, your account is Updated by an Admin', 0, 0, 0, '2025-03-11 20:15:17'),
(3, 358, 'Hi,MD Leon, your account is created Successfully', 0, 0, 0, '2025-03-11 20:16:53'),
(4, 359, 'Hi,Nannu Islam, your account is created Successfully', 0, 0, 0, '2025-03-13 20:38:25'),
(5, 360, 'Hi,Swadhin, your account is created Successfully', 0, 0, 0, '2025-03-18 01:16:11'),
(7, 362, 'Hi,Md Rakibul, your account is created Successfully', 0, 0, 0, '2025-05-09 21:41:18'),
(8, 363, 'Hi,RP DEVELOPER, your account is created Successfully', 0, 0, 0, '2025-05-09 21:45:17'),
(9, 1, 'Hi,R Lab BD, your account is Updated by an Admin', 0, 0, 0, '2025-05-09 21:52:37');

-- --------------------------------------------------------

--
-- Table structure for table `options`
--

CREATE TABLE `options` (
  `id` int(9) NOT NULL,
  `name` text DEFAULT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `options`
--

INSERT INTO `options` (`id`, `name`, `value`) VALUES
(1, 'is_maintenance_mode', '0'),
(2, 'site_title', 'bdbetterpay.com'),
(3, 'site_description', 'bdbetterpay.com is your one-stop platform for seamless and secure payment automation. We specialise in streamlining payment processes for businesses and individuals, offering features like recurring billing, real-time transaction tracking, and integration with multiple payment gateways. With a focus on efficiency and user-friendliness, Auto Pay Solution ensures your payments are handled effortlessly, giving you more time to focus on growth. Experience the convenience of automated payments with our cutting-edge technology and reliable customer support.'),
(4, 'site_keywords', 'bdbetterpay.com'),
(5, 'site_icon', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734947867_4e920b1c6db0a27cf27a.png'),
(6, 'site_name', 'bdbetterpay.com'),
(7, 'default_limit_per_page', '40'),
(8, 'currency_decimal', '2'),
(9, 'currency_decimal_separator', 'dot'),
(10, 'currency_thousand_separator', 'comma'),
(11, 'currency_symbol', '৳'),
(12, 'maintenance_mode_time', '2024-06-02T20:31'),
(13, 'enable_https', '1'),
(14, 'optimize', '1'),
(15, 'address', 'Jigatola, Dhanmondi, Dhaka'),
(16, 'social_github_link', '#'),
(17, 'social_facebook_link', 'https://www.facebook.com/'),
(18, 'social_instagram_link', '#'),
(19, 'social_pinterest_link', '#'),
(20, 'social_twitter_link', '#'),
(21, 'social_tumblr_link', ''),
(22, 'social_youtube_link', '#'),
(23, 'contact_tel', '+8801783632964(WhatsApp)'),
(24, 'contact_email', 'tuktakpay@gmail.com'),
(25, 'contact_work_hour', 'Sat-Thu 09 am - 10 pm'),
(26, 'copy_right_content', 'BDBetterPay'),
(27, 'update_file', '1'),
(28, 'honeypot', ''),
(29, 'site_logo', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734614395_c0c3762ef72a251de9e6.png'),
(30, 'is_clear_ticket', '0'),
(31, 'default_clear_ticket_days', '30'),
(32, 'default_pending_ticket_per_user', '0'),
(33, 'enable_notification_popup', '0'),
(34, 'notification_popup_content', '<p><span style=\"color: #0000ff;\"><strong>টুকটাক পে তে আপনাকে স্বাগত জানাই।</strong></span> <br />টুকটাক পে সম্পর্কিত সমস্যা ও সম্ভাবনা জানান আমাদের-<br />fb.com/tuktakpay<br />Telegram: t.me/paytuktak</p>\r\n<p>ধন্যবাদ<br />টুকটাক পে টিম</p>'),
(35, 'enable_panel_notification_popup', '0'),
(36, 'notification_popup_panel_content', '<p><span style=\"color: #0000ff;\"><strong>টুকটাক পে তে আপনাকে স্বাগত জানাই।</strong></span> <br />টুকটাক পে সম্পর্কিত সমস্যা ও সম্ভাবনা জানান আমাদের-<br />fb.com/tuktakpay<br />Telegram: t.me/paytuktak</p>\r\n<p>ধন্যবাদ<br />টুকটাক পে টিম</p>'),
(37, 'is_verification_new_account', '0'),
(38, 'is_welcome_email', '0'),
(39, 'is_new_user_email', '0'),
(40, 'email_welcome_email_subject', 'Welcome To Our site'),
(41, 'enable_notification', '1'),
(42, 'email_from', 'support@tuktakpay.com'),
(43, 'email_name', 'TukTak Pay'),
(44, 'email_protocol_type', 'php_mail'),
(45, 'is_addfund_bonus', '0'),
(46, 'is_plan_bonus', '0'),
(47, 'is_signup_bonus', '0'),
(48, 'signup_bonus_amount', '0'),
(49, 'affiliate_bonus_type', ''),
(50, 'affiliate_bonus', '0'),
(51, 'min_affiliate_amount', '0'),
(52, 'max_affiliate_time', '0'),
(53, 'currency_code', 'BDT'),
(54, 'auto_rounding_x_decimal_places', '2'),
(55, 'is_auto_currency_convert', '0'),
(56, 'new_currecry_rate', '1'),
(57, 'policy_content', ''),
(58, 'embed_head_javascript', '&lt;!-- Google tag (gtag.js) --&gt;\r\n&lt;script async src=&quot;https://www.googletagmanager.com/gtag/js?id=G-Y94EHHD0L5&quot;&gt;&lt;/script&gt;\r\n&lt;script&gt; window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag(&#039;js&#039;, new Date()); gtag(&#039;config&#039;, &#039;G-Y94EHHD0L5&#039;);\r\n&lt;/script&gt;\r\n&lt;div id=&quot;myAliceWebChatWA&quot;&gt;&lt;/div&gt;\r\n&lt;!-- Telegram Button --&gt;\r\n&lt;div id=&quot;myAliceWebChatTG&quot;&gt;&lt;/div&gt;\r\n&lt;script&gt;\r\n!function(){ var e, t, n, a; if (!window.MyAliceWebChat) { (t = document.createElement(&quot;div&quot;)).id = &quot;myAliceWebChatLoader&quot;, (n = document.createElement(&quot;script&quot;)).type = &quot;text/javascript&quot;, n.async = !0, n.src = &quot;https://widget.myalice.ai/index.js&quot;, (a = (e = document.body.getElementsByTagName(&quot;script&quot;))[e.length - 1]).parentNode.insertBefore(n, a), a.parentNode.insertBefore(t, a), n.addEventListener(&quot;load&quot;, (function(){ // WhatsApp Button MyAliceWebChat.init({ selector: &quot;myAliceWebChatWA&quot;, number: &quot;+88001625970780&quot;, message: &quot;আসসালাইমুয়ালাইকুম&quot;, color: &quot;#25D366&quot;, channel: &quot;wa&quot;, boxShadow: &quot;none&quot;, text: &quot;Whatsapp&quot;, theme: &quot;light&quot;, position: &quot;left&quot;, mb: &quot;15px&quot;, mx: &quot;20px&quot;, radius: &quot;20px&quot; }); // Telegram Button MyAliceWebChat.init({ selector: &quot;myAliceWebChatTG&quot;, number: &quot;nagorikpay&quot;, message: &quot;&quot;, color: &quot;#2AABEE&quot;, channel: &quot;tg&quot;, boxShadow: &quot;none&quot;, text: &quot;Telegram&quot;, theme: &quot;light&quot;, position: &quot;left&quot;, mt: &quot;40px&quot;, // Top margin mb: &quot;70px&quot;, // Bottom margin mx: &quot;20px&quot;, radius: &quot;20px&quot; }); })); }\r\n}();\r\n&lt;/script&gt;'),
(59, 'embed_javascript', ''),
(60, 'is_payment_notice_email', '0'),
(61, 'is_ticket_notice_email', '0'),
(62, 'is_ticket_notice_email_admin', '0'),
(63, 'is_order_notice_email', '0'),
(64, 'smtp_server', ''),
(65, 'smtp_port', '587'),
(66, 'smtp_encryption', 'tls'),
(67, 'smtp_username', ''),
(68, 'smtp_password', ''),
(69, 'limit_per_page', '10'),
(70, 'terms_content', ''),
(71, 'enable_all_user', '1'),
(72, 'enable_database_cache', '1'),
(73, 'enable_tickets', '1'),
(74, 'affiliate_level', '4'),
(75, 'verification_email_subject', '{{website_name}} - Please validate your account'),
(76, 'verification_email_content', '<p><strong>Welcome to {{website_name}}!&nbsp;</strong></p>\r\n<p>Hello <strong>{{first_name}}</strong>!</p>\r\n<p>&nbsp;Thank you for joining! We\'re glad to have you as community member, and we\'re stocked for you to start exploring our service. &nbsp;If you don\'t verify your address, you won\'t be able to create a&nbsp;User Account.</p>\r\n<p>&nbsp;&nbsp;All you need to do is activate your account&nbsp;by click this link:&nbsp;<br />&nbsp; {{activation_link}}&nbsp;</p>\r\n<p>Thanks and Best Regards!</p>'),
(77, 'email_welcome_email_content', '<p><strong>Welcome to {{website_name}}!&nbsp;</strong></p>\r\n<p>Hello <strong>{{first_name}}</strong>!</p>\r\n<p>Congratulations!&nbsp;<br />You have successfully signed up for our service - {{website_name}}&nbsp;with follow data</p>\r\n<ul>\r\n<li>Firstname: {{first_name}}</li>\r\n<li>Lastname: {{last_name}}</li>\r\n<li>Email: {{email}}</li>\r\n<li>Timezone: {{user_timezone}}</li>\r\n</ul>\r\n<p>We want to exceed your expectations, so please do not&nbsp;hesitate to reach out at any time if you have any questions or concerns. We look to working with you.</p>\r\n<p>Best Regards,</p>'),
(78, 'email_new_registration_subject', '{{website_name}} - New Registration'),
(79, 'email_new_registration_content', '<p>Hi Admin!</p>\r\n<p>Someone signed up in <strong>{{website_name}}</strong> with follow data</p>\r\n<ul>\r\n<li>Firstname {{first_name}}</li>\r\n<li>Lastname: {{last_name}}</li>\r\n<li>Email: {{email}}</li>\r\n<li>Timezone: {{user_timezone}}</li>\r\n</ul>'),
(80, 'email_password_recovery_subject', '{{website_name}} - Password Recovery'),
(81, 'email_password_recovery_content', '<p>Hi<strong> {{first_name}}!&nbsp;</strong></p>\r\n<p>Somebody (hopefully you) requested a new password for your account.&nbsp;</p>\r\n<p>No changes have been made to your account yet.&nbsp;<br />You can reset your password by click this link:&nbsp;<br />{{recovery_password_link}}</p>\r\n<p>If you did not request a password reset, no further action is required.&nbsp;</p>\r\n<p>Thanks and Best Regards!</p>'),
(82, 'admin_email_password_recovery_subject', '{{website_name}} - Password Recovery'),
(83, 'admin_email_password_recovery_content', '<p>Hi<strong> {{first_name}}!&nbsp;</strong></p>\r\n<p>Somebody (hopefully you) requested a new password for your account.&nbsp;</p>\r\n<p>No changes have been made to your account yet.&nbsp;<br />You can reset your password by click this link:&nbsp;<br />{{admin_recovery_password_link}}</p>\r\n<p>If you did not request a password reset, no further action is required.&nbsp;</p>\r\n<p>Thanks and Best Regards!</p>'),
(84, 'email_payment_notice_subject', '{{website_name}} -  Thank You! Deposit Payment Received'),
(85, 'email_payment_notice_content', '<p>Hi<strong> {{first_name}}!&nbsp;</strong></p>\r\n<p>We\'ve just received your final remittance and would like to thank you. We appreciate your diligence in adding funds to your balance in our service.</p>\r\n<p>It has been a pleasure doing business with you. We wish you the best of luck.</p>\r\n<p>Thanks and Best Regards!</p>'),
(86, 'business_name', ''),
(87, 'is_cookie_policy_page', '0'),
(88, 'cookies_policy_page', ''),
(89, 'embed_footee_javascript', ''),
(90, 'home_page', '1'),
(91, 'homepage_code', '\n<section id=\"hero\" class=\"hero d-flex align-items-center\">\n\n    <div class=\"container\">\n        <div class=\"row\">\n            <div class=\"col-lg-6 d-flex flex-column justify-content-center\">\n                <h1 data-aos=\"fade-up\">Automate Your Payments Seamlessly</h1>\n                <h2 data-aos=\"fade-up\" data-aos-delay=\"400\">Join us to experience efficient and secure payment solutions for your business</h2>\n                <div data-aos=\"fade-up\" data-aos-delay=\"600\">\n                    <div class=\"text-center text-lg-start\">\n                        <a href=\"/sign-up\" class=\"btn-get-started scrollto d-inline-flex align-items-center justify-content-center align-self-center\">\n                            <span>Get Started</span>\n                            <i class=\"bi bi-arrow-right\"></i>\n                        </a>\n                    </div>\n                </div>\n            </div>\n            <div class=\"col-lg-6 order-1 order-lg-2 hero-img\" data-aos=\"zoom-out\">\n            \n            <img src=\"<?= base_url(\'public/assets/plat\') ?>/123123-1.png\" class=\"img-fluid animated\" alt=\"\">\n          </div> \n            \n        </div>\n    </div>\n\n</section><!-- End Hero -->\n\n<main id=\"main\">\n\n<section id=\"about\" class=\"values\">\n    <div class=\"container\" data-aos=\"fade-up\">\n        <header class=\"section-header\">\n            <h2>We Offer</h2>\n            <p>Our guiding principles that empower seamless payment solutions</p>\n        </header>\n\n        <div class=\"row\">\n            <div class=\"col-lg-4\" data-aos=\"fade-up\" data-aos-delay=\"200\">\n                <div class=\"box\">\n                    <img src=\"<?= base_url(\'public/assets/plat\') ?>/tt.png\" class=\"img-fluid\" alt=\"\">\n                    <h3>Save Time</h3>\n                    <p>Simplify your payment processes and save valuable time with our integrated MFS API, ensuring fast and efficient transactions.</p>\n                </div>\n            </div>\n\n            <div class=\"col-lg-4 mt-4 mt-lg-0\" data-aos=\"fade-up\" data-aos-delay=\"400\">\n                <div class=\"box\">\n                    <img src=\"<?= base_url(\'public/assets/plat\') ?>/nh.png\" class=\"img-fluid\" alt=\"\">\n                    <h3>Seamless Integration</h3>\n                    <p>Easily connect and integrate with our system. Automate workflows, link applications, and manage data sources effortlessly.</p>\n                </div>\n            </div>\n\n            <div class=\"col-lg-4 mt-4 mt-lg-0\" data-aos=\"fade-up\" data-aos-delay=\"600\">\n                <div class=\"box\">\n                    <img src=\"<?= base_url(\'public/assets/plat\') ?>/mm.png\" class=\"img-fluid\" alt=\"\">\n                    <h3>Automate Personal Accounts</h3>\n                    <p>Streamline your payment reception with NagorikPay\'s automation. Direct payments to your personal account without manual intervention.</p>\n                </div>\n            </div>\n\n            <div class=\"col-lg-4 mt-4 mt-lg-0\" data-aos=\"fade-up\" data-aos-delay=\"800\">\n                <div class=\"box\">\n                    <img src=\"<?= base_url(\'public/assets/plat\') ?>/5644447.png\" class=\"img-fluid\" alt=\"\">\n                    <h3>Invoice Generator</h3>\n                    <p>Create and send personalized payment links via email for quick and easy payments, eliminating the need for a website or online store.</p>\n                </div>\n            </div>\n\n            <div class=\"col-lg-4 mt-4 mt-lg-0\" data-aos=\"fade-up\" data-aos-delay=\"1000\">\n                <div class=\"box\">\n                    <img src=\"<?= base_url(\'public/assets/plat\') ?>/6221918.png\" class=\"img-fluid\" alt=\"\">\n                    <h3>Billing Management</h3>\n                    <p>Simplify billing with NagorikPay\'s automated system. Monitor transactions, generate invoices, and streamline your billing process efficiently.</p>\n                </div>\n            </div>\n\n            <div class=\"col-lg-4 mt-4 mt-lg-0\" data-aos=\"fade-up\" data-aos-delay=\"1200\">\n                <div class=\"box\">\n                    <img src=\"<?= base_url(\'public/assets/plat\') ?>/2903544.png\" class=\"img-fluid\" alt=\"\">\n                    <h3>Multiple Payment Options</h3>\n                    <p>Offer your customers various payment methods, including Mobile Banking and Bank Transfers, through NagorikPay\'s versatile platform.</p>\n                </div>\n            </div>\n\n            \n        </div>\n    </div>\n</section><!-- End Values Section -->\n\n\n\n    <section id=\"counts\" class=\"counts\">\n    <div class=\"container\" data-aos=\"fade-up\">\n\n        <div class=\"row gy-4\">\n\n            <div class=\"col-lg-3 col-md-6\">\n                <div class=\"count-box\">\n                    <!-- Updated icon -->\n                    <i class=\"bi bi-people-fill\"></i>\n                    <div>\n                        <span data-purecounter-start=\"0\" data-purecounter-end=\"1963\" data-purecounter-duration=\"1\" class=\"purecounter\"></span>\n                        <p>Happy Clients</p>\n                    </div>\n                </div>\n            </div>\n\n            <div class=\"col-lg-3 col-md-6\">\n                <div class=\"count-box\">\n                    <!-- Updated icon -->\n                    <i class=\"bi bi-book-half\" style=\"color: #ee6c20;\"></i>\n                    <div>\n                        <span data-purecounter-start=\"0\" data-purecounter-end=\"6\" data-purecounter-duration=\"1\" class=\"purecounter\"></span>\n                        <p>Plans</p>\n                    </div>\n                </div>\n            </div>\n\n            <div class=\"col-lg-3 col-md-6\">\n                <div class=\"count-box\">\n                    <!-- Updated icon -->\n                    <i class=\"bi bi-graph-up\" style=\"color: #15be56;\"></i>\n                    <div>\n                        <span data-purecounter-start=\"0\" data-purecounter-end=\"3287490\" data-purecounter-duration=\"1\" class=\"purecounter\"></span>\n                        <p>Total Amount Transactions</p>\n                    </div>\n                </div>\n            </div>\n\n            <div class=\"col-lg-3 col-md-6\">\n                <div class=\"count-box\">\n                    <!-- Updated icon -->\n                    <i class=\"bi bi-credit-card\" style=\"color: #bb0852;\"></i>\n                    <div>\n                        <span data-purecounter-start=\"0\" data-purecounter-end=\"12\" data-purecounter-duration=\"1\" class=\"purecounter\"></span>\n                        <p>Supported Payment Methods</p>\n                    </div>\n                </div>\n            </div>\n\n        </div>\n\n    </div>\n</section>\n\n    <section id=\"features\" class=\"features\">\n\n    <div class=\"container\" data-aos=\"fade-up\">\n\n        <header class=\"section-header\">\n            <h2>Features</h2>\n            <p>Advanced capabilities for streamlined payments</p>\n        </header>\n\n        <div class=\"row\">\n\n              <div class=\"col-xl-6\" data-aos=\"zoom-out\" data-aos-delay=\"100\">\n            \n            <img src=\"<?= base_url(\'public/assets/plat\') ?>/13429923.jpg\" class=\"img-fluid\" alt=\"\">\n          </div> \n                \n\n            <div class=\"col-lg-6 mt-5 mt-lg-0 d-flex\">\n                <div class=\"row align-self-center gy-4\">\n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"200\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-speedometer2\"></i>\n                            <h3>Real-Time Processing</h3>\n                        </div>\n                    </div>\n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"300\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-shield-lock\"></i>\n                            <h3>High Security</h3>\n                        </div>\n                    </div>\n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"400\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-arrows-expand\"></i>\n                            <h3>Scalability</h3>\n                        </div>\n                    </div>\n\n                  \n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"600\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-link\"></i>\n                            <h3>Seamless Integration</h3>\n                        </div>\n                    </div>\n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"700\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-graph-up\"></i>\n                            <h3>Comprehensive Reporting</h3>\n                        </div>\n                    </div>\n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"800\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-check-circle\"></i>\n                            <h3>Automatic Payment Verification</h3>\n                        </div>\n                    </div>\n\n                    <div class=\"col-md-6\" data-aos=\"zoom-out\" data-aos-delay=\"900\">\n                        <div class=\"feature-box d-flex align-items-center\">\n                            <i class=\"bi bi-cash\"></i>\n                            <h3>No Transaction Fees</h3>\n                        </div>\n                    </div>\n\n                </div>\n            </div>\n\n        </div> <!-- / row -->\n\n    </div>\n\n</section><!-- End Features Section -->\n<section id=\"services\" class=\"services\">\n\n    <div class=\"container\" data-aos=\"fade-up\">\n\n        <header class=\"section-header\">\n            <h2>Services</h2>\n            <p>Explore our range of services</p>\n        </header>\n\n        <div class=\"row mt-5\">\n\n            <div class=\"col-lg-4 col-md-6\" data-aos=\"fade-up\" data-aos-delay=\"200\">\n                <div class=\"service-box blue\">\n                    <i class=\"bi bi-lightning-charge-fill icon\"></i>\n                    <h3>Instant Payment</h3>\n                    <p>After the customer makes the payment through NAGORIKPAY, it will be instantly added to account with automatic verification.</p>\n                      </div>\n            </div>\n\n            <div class=\"col-lg-4 col-md-6\" data-aos=\"fade-up\" data-aos-delay=\"300\">\n                <div class=\"service-box orange\">\n                    <i class=\"bi bi-arrow-repeat icon\"></i>\n                    <h3>Lifetime Updates</h3>\n                    <p>Enjoy free lifetime updates with the desired service.</p>\n                        </div>\n            </div>\n\n            <div class=\"col-lg-4 col-md-6\" data-aos=\"fade-up\" data-aos-delay=\"400\">\n                <div class=\"service-box green\">\n                    <i class=\"bi bi-wallet icon\"></i>\n                    <h3>Unlimited Transactions</h3>\n                    <p>Receive unlimited payments with Nagorikpay without any fees.</p>\n                     </div>\n            </div>\n\n            <div class=\"col-lg-4 col-md-6\" data-aos=\"fade-up\" data-aos-delay=\"500\">\n                <div class=\"service-box red\">\n                    <i class=\"bi bi-chat-dots icon\"></i>\n                    <h3>24/7 Support</h3>\n                    <p>Our support team is available 24/7 to solve any issues, including NagorikPay setup and usage.</p>\n                     </div>\n            </div>\n\n            <div class=\"col-lg-4 col-md-6\" data-aos=\"fade-up\" data-aos-delay=\"600\">\n                <div class=\"service-box purple\">\n                    <i class=\"bi bi-credit-card icon\"></i>\n                    <h3>Payment Processing</h3>\n                    <p>Efficient and secure processing for all your payment needs, ensuring seamless transactions every time.</p>\n                     </div>\n            </div>\n\n            <div class=\"col-lg-4 col-md-6\" data-aos=\"fade-up\" data-aos-delay=\"700\">\n                <div class=\"service-box pink\">\n                    <i class=\"bi bi-shield-check icon\"></i>\n                    <h3>Fraud Prevention</h3>\n                    <p>Advanced fraud prevention measures to protect your business and customers from unauthorized activities.</p>\n                      </div>\n            </div>\n\n        </div>\n\n    </div>\n\n</section><!-- End Services Section -->\n\n</main>\n\n\n\n    <!-- ======= Pricing Section ======= -->\n    <section id=\"pricing\" class=\"pricing\">\n\n        <div class=\"container\" data-aos=\"fade-up\">\n\n            <header class=\"section-header\">\n                <h2>Pricing</h2>\n                <p>Check our Pricing</p>\n            </header>\n\n            <div class=\"row gy-4\" data-aos=\"fade-left\">\n\n                <?php if (!empty($plans)) : foreach ($plans as $plan) :  ?>\n                        <div class=\"col-lg-3 col-md-6\" data-aos=\"zoom-in\" data-aos-delay=\"100\">\n                            <div class=\"box\">\n                                <h3 style=\"color: #07d5c0;\"><?= $plan[\'name\'] ?></h3>\n                                <div class=\"price\"><sup></sup><?= currency_format($plan[\'final_price\']) ?><span> / <?= duration_type($plan[\'name\'], $plan[\'duration_type\'], $plan[\'duration\'], false) ?></span></div>\n                                <p class=\"text-center\"><?= $plan[\'description\'] ?></p>\n\n                                <ul>\n                                    \n                                    <li><?= plan_message(\'brand\', $plan[\'brand\']) ?></li>\n                                    <li><?= plan_message(\'device\', $plan[\'device\']) ?></li>\n                                    <li><?= plan_message(\'transaction\', $plan[\'transaction\']) ?></li>\n                                </ul>\n                                <a href=\"<?= user_url(\'plans\') ?>\" class=\"btn-buy\">Buy Now</a>\n                            </div>\n                        </div>\n                <?php endforeach;\n                endif; ?>\n\n\n\n            </div>\n\n        </div>\n\n        </div>\n\n    </section><!-- End Pricing Section -->\n    \n    <!-- ======= Platform Section ======= -->\n    <section id=\"\" class=\"clients\">\n\n      <div class=\"container\" data-aos=\"fade-up\">\n\n        <header class=\"section-header\">\n          <p>Supported Platforms</p>\n        </header>\n\n        <div class=\"clients-slider swiper\">\n          <div class=\"swiper-wrapper align-items-center\">\n          <div class=\"swiper-slide\"><img src=\"public/assets/plat/smm.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/php.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/javascript.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/jquery.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/nodejs.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/whmcs-logo.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/woocommerce-logo-transparent.png\" class=\"img-fluid\" alt=\"\"></div>\n            <div class=\"swiper-slide\"><img src=\"public/assets/plat/wordpress-logo-stacked-rgb.png\" class=\"img-fluid\" alt=\"\"></div>\n          </div>\n          <div class=\"swiper-pagination\"></div>\n        </div>\n      </div>\n\n    </section><!-- End Section -->\n    \n    \n    <!-- ======= F.A.Q Section ======= -->\n    <section id=\"faq\" class=\"faq\">\n\n        <div class=\"container\" data-aos=\"fade-up\">\n\n            <header class=\"section-header\">\n                <h2>F.A.Q</h2>\n                <p>Frequently Asked Questions</p>\n            </header>\n            <?php if (!empty($items)) : ?>\n                <div class=\"row\">\n                    <div class=\"col-lg-6\">\n                        <!-- F.A.Q List 1-->\n                        <div class=\"accordion accordion-flush\" id=\"faqlist1\">\n                            <?php\n                            // Split items for the first column\n                            $firstColumnItems = array_slice($items, 0, ceil(count($items) / 2));\n                            foreach ($firstColumnItems as $key => $item) : ?>\n                                <div class=\"accordion-item wow fadeInUp\" data-wow-delay=\"0.1s\">\n                                    <h2 class=\"accordion-header\" id=\"m<?= $item[\'id\'] ?>\">\n                                        <button class=\"accordion-button <?= $key == 0 ? \'\' : \'collapsed\' ?>\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#kkk<?= $item[\'id\'] ?>\" aria-expanded=\"<?= $key == 0 ? \'true\' : \'false\' ?>\" aria-controls=\"kkk<?= $item[\'id\'] ?>\">\n                                            <?= $item[\'question\'] ?>\n                                        </button>\n                                    </h2>\n                                    <div id=\"kkk<?= $item[\'id\'] ?>\" class=\"accordion-collapse collapse <?= $key == 0 ? \'show\' : \'\' ?>\" aria-labelledby=\"m<?= $item[\'id\'] ?>\" data-bs-parent=\"#faqlist1\">\n                                        <div class=\"accordion-body\">\n                                            <?= $item[\'answer\'] ?>\n                                        </div>\n                                    </div>\n                                </div>\n                            <?php endforeach; ?>\n                        </div>\n                    </div>\n\n                    <div class=\"col-lg-6\">\n                        <!-- F.A.Q List 2-->\n                        <div class=\"accordion accordion-flush\" id=\"faqlist2\">\n                            <?php\n                            // Split items for the second column\n                            $secondColumnItems = array_slice($items, ceil(count($items) / 2));\n                            foreach ($secondColumnItems as $key => $item) : ?>\n                                <div class=\"accordion-item wow fadeInUp\" data-wow-delay=\"0.1s\">\n                                    <h2 class=\"accordion-header\" id=\"m<?= $item[\'id\'] ?>\">\n                                        <button class=\"accordion-button collapsed\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#kkk<?= $item[\'id\'] ?>\" aria-expanded=\"false\" aria-controls=\"kkk<?= $item[\'id\'] ?>\">\n                                            <?= $item[\'question\'] ?>\n                                        </button>\n                                    </h2>\n                                    <div id=\"kkk<?= $item[\'id\'] ?>\" class=\"accordion-collapse collapse\" aria-labelledby=\"m<?= $item[\'id\'] ?>\" data-bs-parent=\"#faqlist2\">\n                                        <div class=\"accordion-body\">\n                                            <?= $item[\'answer\'] ?>\n                                        </div>\n                                    </div>\n                                </div>\n                            <?php endforeach; ?>\n                        </div>\n                    </div>\n                </div>\n            <?php endif; ?>\n\n\n        </div>\n\n    </section><!-- End F.A.Q Section -->\n\n    <section id=\"clients\" class=\"clients\">\n\n        <div class=\"container\" data-aos=\"fade-up\">\n\n            <header class=\"section-header\">\n                <p>Supported Gateways</p>\n            </header>\n\n            <div class=\"clients-slider swiper\">\n                <div class=\"swiper-wrapper align-items-center\">\n                    <?php if (!empty($payments)) : foreach ($payments as $payment) : ?>\n                            <div class=\"swiper-slide\"><img src=\"<?= base_url() . @get_value(get_value($payment[\'params\'], \'option\'), \'logo\'); ?>\" class=\"img-fluid\" alt=\"\"></div>\n                    <?php endforeach;\n                    endif; ?>\n                </div>\n                <div class=\"swiper-pagination\"></div>\n            </div>\n        </div>\n\n    </section><!-- End Clients Section -->\n    \n<section id=\"contact\" class=\"contact\">\n\n      <div class=\"container\" data-aos=\"fade-up\">\n\n        <header class=\"section-header\">\n          <p>Contact US</p>\n        </header>\n\n        <div class=\"row gy-4\">\n\n          <div class=\"col-lg-6\">\n\n            <div class=\"row gy-4\">\n              <div class=\"col-md-6\">\n                <div class=\"info-box\">\n                  <i class=\"bi bi-geo-alt\"></i>\n                  <h3>Address</h3>\n                  <p><?= site_config(\'address\') ?></p>\n                </div>\n              </div>\n              <div class=\"col-md-6\">\n                <div class=\"info-box\">\n                  <i class=\"bi bi-telephone\"></i>\n                  <h3>Call Us</h3>\n                  <p><?= site_config(\'contact_tel\') ?></p>\n                </div>\n              </div>\n              <div class=\"col-md-6\">\n                <div class=\"info-box\">\n                  <i class=\"bi bi-envelope\"></i>\n                  <h3>Email Us</h3>\n                  <p><?= site_config(\'contact_email\') ?></p>\n                </div>\n              </div>\n              <div class=\"col-md-6\">\n                <div class=\"info-box\">\n                  <i class=\"bi bi-clock\"></i>\n                  <h3>Open Hours</h3>\n                  <p><?= site_config(\'contact_work_hour\') ?></p>\n                </div>\n              </div>\n            </div>\n\n          </div>\n\n          \n\n        </div>\n\n      </div>\n\n    </section><!-- End Contact Section -->\n\n\n\n</main><!-- End #main -->'),
(92, 'google_login', '1'),
(93, 'google_auth_clientId', 'Google Auth Client Id'),
(94, 'google_auth_clientSecret', 'Google Auth ClientSecret'),
(95, 'enable_google_recaptcha', '0'),
(96, 'google_capcha_site_key', ''),
(97, 'google_capcha_secret_key', ''),
(98, 'enable_kyc', '1'),
(99, 'preloader', '0'),
(100, 'enable_google_translator', '1'),
(101, 'enable_goolge_translator', '0'),
(102, 'preoloader', '1'),
(103, 'enable_goolge_recapcha', '0'),
(104, 'enable_google_recapcha', '1'),
(105, 'sms_api_char_length', ''),
(106, 'sms_api_o_char_length', ''),
(107, 'sms_api_cost', ''),
(108, 'sms_api_header_data', ''),
(109, 'sms_api_params', ''),
(110, 'sms_api_formdata', 'h'),
(111, 'sms_api_success_key', 'response_code'),
(112, 'sms_api_success_value', '202'),
(113, 'is_user_trx_sms', '0'),
(114, 'is_user_customer_trx_sms', '0'),
(115, 'is_user_plan_sms', '0'),
(116, 'is_user_addon_sms', '0'),
(117, 'sms_api_method', 'POST'),
(118, 'sms_api_url', 'https://rest.nexmo.com/sms/json'),
(119, 'theme', 'custom'),
(120, 'user_plan_sms', 'Hi<strong> {{first_name}}!</strong>A plan of {{pay_amount}} tk has been added to your account successfully!</p>'),
(124, 'site_paymentform', 'V2'),
(125, 'website_name', 'Your Site'),
(126, 'website_favicon', 'https://trustpaybd.com/assets/images/favicon.png'),
(127, 'website_logo', ''),
(128, 'site_form', 'V4');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `name` varchar(225) NOT NULL,
  `sort` int(3) DEFAULT NULL,
  `status` varchar(10) NOT NULL DEFAULT '0' COMMENT '1=on, 0=off',
  `params` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `type`, `name`, `sort`, `status`, `params`) VALUES
(1, 'BDBetterPay', 'BD Better Pay', 1, '1', '{\"type\":\"BDBetterPay\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1734519128_69d5a090b9b3df244e02.jpg\"},\"name\":\"BD Better Pay\",\"status\":\"1\"}'),
(13, 'bkash', 'Bkash', 2, '1', '{\"type\":\"bkash\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720001734_bed271b1089aa12b9887.png\"},\"name\":\"Bkash\",\"status\":\"1\"}'),
(20, 'nagad', 'Nagad', 3, '1', '{\"type\":\"nagad\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717231942_d63fe41b5e42176d4936.png\"},\"name\":\"Nagad\",\"status\":\"1\"}'),
(21, 'rocket', 'Rocket', 4, '1', '{\"type\":\"rocket\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717239532_10348cc78dc0b990a8e5.png\"},\"name\":\"Rocket\",\"status\":\"1\"}'),
(22, 'upay', 'Upay', 5, '1', '{\"type\":\"upay\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717239551_f0b3a097df92d481e17f.png\"},\"name\":\"Upay\",\"status\":\"1\"}'),
(23, 'cellfin', 'Cellfin', 6, '1', '{\"type\":\"cellfin\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717239575_607da191972f326bb061.png\"},\"name\":\"Cellfin\",\"status\":\"1\"}'),
(24, 'ibl', 'Islamic Bank', 8, '1', '{\"type\":\"ibl\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719310270_cf7aa34e989a1c87b73b.png\"},\"name\":\"Islamic Bank\",\"status\":\"1\"}'),
(25, 'bbrac', 'Brac Bank', 15, '1', '{\"type\":\"bbrac\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717513007_a36d41cb85a2daa5c0d7.png\"},\"name\":\"Brac Bank\",\"status\":\"1\"}'),
(26, 'basia', 'Bank Asia', 16, '1', '{\"type\":\"basia\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717513044_27c3590d4bdfcf8e000f.png\"},\"name\":\"Bank Asia\",\"status\":\"1\"}'),
(27, 'dbbl', 'DBBL Bank', 12, '1', '{\"type\":\"dbbl\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719309653_65205cb7a54698f09f34.png\"},\"name\":\"DBBL Bank\",\"status\":\"1\"}'),
(28, 'agrani', 'Agrani Bank', 17, '1', '{\"type\":\"agrani\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719309709_13101fe233cfc95bb28b.png\"},\"name\":\"Agrani Bank\",\"status\":\"1\"}'),
(29, 'ebl', 'EBL Bank', 14, '1', '{\"type\":\"ebl\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719310018_5321255676af2e28a190.png\"},\"name\":\"EBL Bank\",\"status\":\"1\"}'),
(30, 'basic', 'Basic Bank', 13, '1', '{\"type\":\"basic\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719309961_62ead36f575ac147ac18.png\"},\"name\":\"Basic Bank\",\"status\":\"1\"}'),
(31, 'jamuna', 'Jamuna Bank', 18, '1', '{\"type\":\"jamuna\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719309764_ecf6e5b30fb0d31dd0f2.png\"},\"name\":\"Jamuna Bank\",\"status\":\"1\"}'),
(32, 'ific', 'IFIC Bank', 19, '1', '{\"type\":\"ific\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719309900_b9fed4d4912f17f8f310.png\"},\"name\":\"IFIC Bank\",\"status\":\"1\"}'),
(33, 'sonali', 'Sonali Bank', 11, '1', '{\"type\":\"sonali\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717512472_49287598d04a98036bd3.png\"},\"name\":\"Sonali Bank\",\"status\":\"1\"}'),
(34, 'Ipay', 'Ipay', 24, '1', '{\"type\":\"Ipay\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720105981_89786069962c9b386204.webp\"},\"name\":\"Ipay\",\"status\":\"1\"}'),
(35, 'tap', 'tap', 7, '1', '{\"type\":\"tap\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717239652_9e61829d743ec04049e5.png\"},\"name\":\"tap\",\"status\":\"1\"}'),
(36, 'paypal', 'Paypal', 25, '0', '{\"type\":\"paypal\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717513660_56a478dea2bf98f3e022.png\"},\"name\":\"Paypal\",\"status\":\"0\"}'),
(37, '2checkout', '2checkout', 26, '0', '{\"type\":\"2checkout\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720100844_1656c9ab1694ae2459f7.png\"},\"name\":\"2checkout\",\"status\":\"1\"}'),
(39, 'binance', 'Binance', 20, '1', '{\"type\":\"binance\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717513584_d7ff0294bf6b6c98db7b.png\"},\"name\":\"Binance\",\"status\":\"1\"}'),
(40, 'abbank', 'AB Bank', 9, '1', '{\"type\":\"abbank\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719309599_b6aac1ea1fb6fa57ffb2.png\"},\"name\":\"AB Bank\",\"status\":\"1\"}'),
(41, 'citybank', 'City Bank', 10, '1', '{\"type\":\"citybank\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717512423_12782dab3a9f260e0c5d.png\"},\"name\":\"City Bank\",\"status\":\"1\"}'),
(42, 'mastercard', 'Mastercard', 23, '0', '{\"type\":\"mastercard\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720100801_cffe430721df95dae74b.png\"},\"name\":\"Mastercard\",\"status\":\"1\"}'),
(43, 'coinbase', 'Coinbase', 22, '0', '{\"type\":\"coinbase\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719311214_11838c32962f35810b58.png\"},\"name\":\"Coinbase\",\"status\":\"1\"}'),
(44, 'payeer', 'Payeer', 21, '1', '{\"type\":\"payeer\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1717513731_81f4435ab5365e24f0b6.png\"},\"name\":\"Payeer\",\"status\":\"0\"}'),
(45, 'surecash', 'Sure Cash', 31, '1', '{\"type\":\"surecash\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719306582_f4ec8dc3e2a7da47151a.png\"},\"name\":\"Sure Cash\",\"status\":\"1\"}'),
(46, 'okwallet', 'Ok Wallet', 29, '1', '{\"type\":\"okwallet\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719306339_29c6b8d2a1d36349a356.png\"},\"name\":\"Ok Wallet\",\"status\":\"1\"}'),
(47, 'perfectmoney', 'Perfect Money', 34, '0', '{\"type\":\"perfectmoney\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1719311265_24bcdf2b9be294a3c28b.png\"},\"name\":\"Perfect Money\",\"status\":\"1\"}'),
(48, 'coinpayments', 'Coinpayments', 30, '0', '{\"type\":\"coinpayments\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720100760_f9e19f2550433c2aa06a.png\"},\"name\":\"Coinpayments\",\"status\":\"1\"}'),
(49, 'mcash', 'MCash', 44, '1', '{\"type\":\"mcash\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720096138_9c15f75876952675f8a0.webp\"},\"name\":\"MCash\",\"status\":\"1\"}'),
(51, 'easypaisa', 'Easy Paisa', 45, '0', '{\"type\":\"easypaisa\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720096060_9cb999b4a54c789d3cea.png\"},\"name\":\"Easy Paisa\",\"status\":\"1\"}'),
(52, 'mycash', 'myCash', 46, '1', '{\"type\":\"mycash\",\"option\":{\"logo\":\"public\\/uploads\\/admin\\/356a192b7913b04c54574d18c28d46e6395428ab\\/1720097170_0d54ea45149671627510.jpeg\"},\"name\":\"myCash\",\"status\":\"1\"}');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `brand` int(10) NOT NULL,
  `device` int(10) NOT NULL,
  `transaction` int(10) NOT NULL,
  `price` decimal(10,3) NOT NULL DEFAULT 0.000,
  `final_price` decimal(10,3) NOT NULL DEFAULT 0.000,
  `duration` int(3) NOT NULL COMMENT 'number of unit -1 for lifetime',
  `duration_type` int(3) NOT NULL COMMENT '1=day,2=month, 3=year',
  `sort` int(10) NOT NULL,
  `status` int(2) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `ids`, `name`, `description`, `brand`, `device`, `transaction`, `price`, `final_price`, `duration`, `duration_type`, `sort`, `status`, `created_at`, `deleted_at`) VALUES
(13, '2c7130a39b77eecb03d96e8db85a84b4', '15 Days', '15 Days', 1, 1, -1, 50.000, 30.000, 15, 1, 2, 0, '2024-12-18 17:48:41', NULL),
(14, '52cfbba9fbd2eb03b6896fa6604b04f9', 'ফ্রি ৭ দিন!', '১টি ওয়েবসাইট ও ১টি ডিভাইসে ব্যবহার করুন', 1, 1, -1, 30.000, 0.000, 7, 1, 1, 1, '2024-12-18 17:56:35', NULL),
(15, 'd9733681d4a03e8a645c84f83e24434a', '30 Days', '২টি ওয়েবসাইট ও ২টি ডিভাইসে ব্যবহার করুন', 2, 2, -1, 150.000, 99.000, 1, 2, 3, 1, '2024-12-18 18:24:30', NULL),
(17, '4a77b6ef1822b0ec677b524abea2356c', '6 Months', '২টি ওয়েবসাইট ও ২টি ডিভাইসে ব্যবহার করুন', 2, 2, -1, 600.000, 499.000, 6, 2, 4, 1, '2024-12-18 21:07:22', NULL),
(19, 'd0ae1261dd32af22894975a51fb860c3', '12 Months', '২টি ওয়েবসাইট ও ৪টি ডিভাইসে ব্যবহার করুন', 2, 4, -1, 1200.000, 799.000, 1, 3, 5, 1, '2024-12-18 21:23:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `queue`
--

CREATE TABLE `queue` (
  `id` int(9) NOT NULL,
  `task_type` text DEFAULT NULL,
  `task_data` text DEFAULT NULL,
  `status` varchar(16) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staffs`
--

CREATE TABLE `staffs` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` varchar(50) NOT NULL,
  `role_id` int(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `first_name` text DEFAULT NULL,
  `last_name` text DEFAULT NULL,
  `balance` decimal(10,3) NOT NULL DEFAULT 0.000,
  `more_information` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `activation_key` varchar(50) DEFAULT NULL,
  `reset_key` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `staffs`
--

INSERT INTO `staffs` (`id`, `ids`, `role_id`, `email`, `first_name`, `last_name`, `balance`, `more_information`, `avatar`, `password`, `status`, `activation_key`, `reset_key`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'admin', 1, 'admin@gmail.com', 'MD', 'Tomij', 0.000, '', 'public/uploads/admin/356a192b7913b04c54574d18c28d46e6395428ab/1734519891_d9639631de1634bf18bc.png', '$2y$10$Yz.3yz/5606gQx9PyOLNsOh7KXjUAxPAoC4j2zyMEM9e42BDW2hoy', 1, 'NO7zqZ9Izd1CO3GPtxx3Ju9kc', 'BtBWimwV5jesBg1DqWhxJmaO26BaC8Og', '2024-06-01 14:33:05', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(11) DEFAULT NULL,
  `template_key` varchar(120) DEFAULT NULL,
  `email_from` varchar(191) NOT NULL DEFAULT 'support@example.com',
  `name` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `template` text DEFAULT NULL,
  `sms_body` text DEFAULT NULL,
  `mail_status` tinyint(1) NOT NULL DEFAULT 0,
  `sms_status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `temp_transactions`
--

CREATE TABLE `temp_transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `brand_id` int(10) UNSIGNED NOT NULL,
  `params` text NOT NULL,
  `meta` text DEFAULT NULL,
  `amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `currency` varchar(10) NOT NULL DEFAULT 'BDT',
  `request` varchar(10) NOT NULL DEFAULT 'GET' COMMENT 'GET or POST',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=pending,1=initiated,2=success,3=cancel',
  `transaction_id` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `temp_transactions`
--

INSERT INTO `temp_transactions` (`id`, `ids`, `uid`, `brand_id`, `params`, `meta`, `amount`, `currency`, `request`, `status`, `transaction_id`, `created_at`, `updated_at`) VALUES
(168, '79406051a6f42cc821fba0d6a673b568', 358, 19, '{\"cus_name\":\"MD Leon  Islam\",\"cus_email\":\"bdbosstv@gmail.com\",\"success_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=31\",\"cancel_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=31\",\"webhook_url\":\"https:\\/\\/panel.hostreset.com\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=31\"}', '[73QMPG6G]', 10.000, 'BDT', 'GET', 0, 'GJO9DC886298', '2025-03-13 23:18:18', NULL),
(169, '800378da44a0f67761f894fb7854f2a1', 358, 19, '{\"cus_name\":\"MD Leon  Islam\",\"cus_email\":\"bdbosstv@gmail.com\",\"success_url\":\"http:\\/\\/\\/viewinvoice.php?id=31\",\"cancel_url\":\"http:\\/\\/\\/viewinvoice.php?id=31\",\"webhook_url\":\"http:\\/\\/\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=31\"}', '[]', 11.000, 'BDT', 'GET', 0, 'SHCMYH942806', '2025-03-14 15:00:06', NULL),
(170, 'befd0d8f78ea94213c5b67f99c69c29e', 358, 19, '{\"cus_name\":\"MD Leon  Islam\",\"cus_email\":\"bdbosstv@gmail.com\",\"success_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=31\",\"cancel_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=31\",\"webhook_url\":\"https:\\/\\/panel.hostreset.com\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=31\"}', '[]', 11.000, 'BDT', 'GET', 2, 'RBP7AJ949243', '2025-03-14 16:47:23', NULL),
(171, 'a995fd5ba7b51aadee6dd9cedb19fc5c', 358, 19, '{\"cus_name\":\"dsfsdf sfds\",\"cus_email\":\"purplekamillah@indigobook.com\",\"success_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=53\",\"cancel_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=53\",\"webhook_url\":\"https:\\/\\/panel.hostreset.com\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=53\"}', '[]', 830.000, 'BDT', 'GET', 0, 'ZVUQ6F101804', '2025-03-16 11:10:04', NULL),
(172, '6089597754e3856a3bc188afa5af7b0e', 1, 8, '{\"cus_name\":\"MD LeonIslam\",\"cus_email\":\"bdbosstv@gmail.com\",\"success_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/success\",\"cancel_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/unsuccess\",\"webhook_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/validate\"}', '{\"phone\":\"01710604946\",\"uid\":\"358\"}', 222.000, 'BDT', 'GET', 0, '3BLHNR162921', '2025-03-17 04:08:41', NULL),
(173, '9a17e8c7833706d5cf98bbf9c28af50c', 358, 19, '{\"cus_name\":\"dsfsdf sfds\",\"cus_email\":\"purplekamillah@indigobook.com\",\"success_url\":\"http:\\/\\/\\/viewinvoice.php?id=53\",\"cancel_url\":\"http:\\/\\/\\/viewinvoice.php?id=53\",\"webhook_url\":\"http:\\/\\/\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=53\"}', '[]', 830.000, 'BDT', 'GET', 0, 'IIL9EA202006', '2025-03-17 15:00:06', NULL),
(174, '06f9a9f752ce7abb56d35b251ab9f0f1', 358, 19, '{\"cus_name\":\"dsfsdf sfds\",\"cus_email\":\"purplekamillah@indigobook.com\",\"success_url\":\"http:\\/\\/\\/viewinvoice.php?id=53\",\"cancel_url\":\"http:\\/\\/\\/viewinvoice.php?id=53\",\"webhook_url\":\"http:\\/\\/\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=53\"}', '[]', 830.000, 'BDT', 'GET', 0, 'HULS1P202006', '2025-03-17 15:00:06', NULL),
(175, 'b10eadbe682154fd5643bf6ea025ca9c', 1, 8, '{\"cus_name\":\"SwadhinKhan\",\"cus_email\":\"khan.swadhin@gmail.com\",\"success_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/success\",\"cancel_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/unsuccess\",\"webhook_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/validate\"}', '{\"phone\":\"01823662233\",\"uid\":\"360\"}', 99999.000, 'BDT', 'GET', 0, 'N54763248720', '2025-03-18 03:58:40', NULL),
(176, 'a96f7c58b9b556f237174a034631b78f', 1, 8, '{\"cus_name\":\"MD LeonIslam\",\"cus_email\":\"bdbosstv@gmail.com\",\"success_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/success\",\"cancel_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/unsuccess\",\"webhook_url\":\"https:\\/\\/dev.bdbetterpay.com\\/user\\/add_funds\\/complete\\/validate\"}', '{\"phone\":\"01710604946\",\"uid\":\"358\"}', 777.000, 'BDT', 'GET', 0, 'Q9LLD6254806', '2025-03-18 05:40:06', NULL),
(177, '3f9f443c1c0462807157280984cbb0c5', 358, 19, '{\"cus_name\":\"AAA\",\"cus_email\":\"a@app.com\",\"success_url\":\"https:\\/\\/dev.bdbetterpay.com\\/invoice\\/9547f957938e1166cc015eb3d91e9db8\",\"cancel_url\":\"https:\\/\\/dev.bdbetterpay.com\\/invoice\\/9547f957938e1166cc015eb3d91e9db8\",\"webhook_url\":\"https:\\/\\/dev.bdbetterpay.com\\/invoice\\/9547f957938e1166cc015eb3d91e9db8?complete=9547f957938e1166cc015eb3d91e9db8\"}', '[]', 777.000, 'BDT', 'GET', 0, 'Q0YMA2254930', '2025-03-18 05:42:10', NULL),
(178, '6d48fbb0b9d7e5967a05b216edf030a3', 358, 19, '{\"cus_name\":\"AAA\",\"cus_email\":\"a@app.com\",\"success_url\":\"https:\\/\\/dev.bdbetterpay.com\\/invoice\\/9547f957938e1166cc015eb3d91e9db8\",\"cancel_url\":\"https:\\/\\/dev.bdbetterpay.com\\/invoice\\/9547f957938e1166cc015eb3d91e9db8\",\"webhook_url\":\"https:\\/\\/dev.bdbetterpay.com\\/invoice\\/9547f957938e1166cc015eb3d91e9db8?complete=9547f957938e1166cc015eb3d91e9db8\"}', '[]', 777.000, 'BDT', 'GET', 0, 'VC7UU4254942', '2025-03-18 05:42:22', NULL),
(179, '5cc394b1b81ffcb8139c045841c0a920', 358, 19, '{\"cus_name\":\"MD Leon  Islam\",\"cus_email\":\"bdbosstv@gmail.com\",\"success_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=39\",\"cancel_url\":\"https:\\/\\/panel.hostreset.com\\/viewinvoice.php?id=39\",\"webhook_url\":\"https:\\/\\/panel.hostreset.com\\/modules\\/gateways\\/callback\\/bdbetterpayv1.php?api=fXB5o17G3eregnsoB266sxelC5qBZGysKo4emeNP9bAEknZf04&invoice=39\"}', '[]', 300.000, 'BDT', 'GET', 0, 'BHQ8U7255222', '2025-03-18 05:47:02', NULL),
(180, '9b07f59a7ce6f9922a9a8148ffce9f87', 1, 8, '{\"cus_name\":\"Md RakibulIslam\",\"cus_email\":\"md0942479@gmail.com\",\"success_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/success\",\"cancel_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/unsuccess\",\"webhook_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/validate\"}', '{\"phone\":\"01825607861\",\"uid\":\"362\"}', 50.000, 'BDT', 'GET', 0, 'IMG3AJ805661', '2025-05-09 21:47:41', NULL),
(181, 'da1d72115347c3f5fc4bcb6ea6ef27d7', 1, 8, '{\"cus_name\":\"Md RakibulIslam\",\"cus_email\":\"md0942479@gmail.com\",\"success_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/success\",\"cancel_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/unsuccess\",\"webhook_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/validate\"}', '{\"phone\":\"01825607861\",\"uid\":\"362\"}', 50.000, 'BDT', 'GET', 0, '0YP0EK805793', '2025-05-09 21:49:53', NULL),
(182, '6ad4d6b8b345765cca5586b7e9b78315', 1, 8, '{\"cus_name\":\"R Lab BDDigital\",\"cus_email\":\"admin@gmail.com\",\"success_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/success\",\"cancel_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/unsuccess\",\"webhook_url\":\"https:\\/\\/egpay.io\\/user\\/add_funds\\/complete\\/validate\"}', '{\"phone\":\"01889298798\",\"uid\":\"1\"}', 50.000, 'BDT', 'GET', 0, 'P9X4NC806304', '2025-05-09 21:58:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `description` text NOT NULL,
  `subject` text NOT NULL,
  `status` varchar(10) NOT NULL DEFAULT 'pending',
  `is_user_read` tinyint(1) NOT NULL DEFAULT 0,
  `is_admin_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `ticket_id` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `author` varchar(20) NOT NULL,
  `support` tinyint(4) NOT NULL COMMENT '1=support, 0=client',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `brand_id` int(10) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `currency` varchar(10) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=pending,1=initiated,2=success,3=cancel',
  `transaction_id` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `ids`, `uid`, `brand_id`, `message`, `type`, `amount`, `currency`, `status`, `transaction_id`, `created_at`, `updated_at`) VALUES
(3, 'befd0d8f78ea94213c5b67f99c69c29e', 358, 19, 'Money Received. Amount: Tk 11.00 Sender: 01716458399 Ref: N/A TxnID: 73QOF3OE Balance: Tk 2799.27 14/03/2025 16:48', 'nagad', 11.000, 'BDT', 2, 'RBP7AJ949243', '2025-03-14 16:49:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` text DEFAULT NULL,
  `last_name` text DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `balance` decimal(10,3) NOT NULL DEFAULT 0.000,
  `more_information` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `api_credentials` text DEFAULT NULL,
  `timezone` text DEFAULT NULL,
  `ref_id` int(10) NOT NULL,
  `ref_key` text DEFAULT NULL,
  `addons` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `activation_key` varchar(50) DEFAULT NULL,
  `reset_key` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `ids`, `email`, `password`, `first_name`, `last_name`, `phone`, `balance`, `more_information`, `avatar`, `api_credentials`, `timezone`, `ref_id`, `ref_key`, `addons`, `status`, `activation_key`, `reset_key`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '1d8b34f05b1f18ef7c00f290cdfd199a', 'admin@gmail.com', '$2y$10$mDGPkWLKhfQEefU5KCbzpuSXldrzf3DKreNTcPTUnuhn8RkvPaBve', 'R Lab BD', 'Digital', '01889298798', 8500.000, NULL, 'public/uploads/user/356a192b7913b04c54574d18c28d46e6395428ab/1746806013_f5bd82cfd5cec3190852.png', NULL, NULL, 0, 'bdfae46efb101d38f5f9d1bc7a9c2fca', NULL, 1, 'AUhPqfygS0d5pP3xCKLHdZAL4', '3ca6RLgKkqIUOjOiJBr4lmVfnNJKEdVJ', '2024-12-07 11:12:50', '2024-12-07 11:15:58', NULL),
(357, '7686c9c4741af5324a5e44895ef0ef37', 'asfv@gmail.com', '$2y$10$u4yyqN8r1tOY9kg8i8e1xODlUlC10aLD7IStfdbkTa/.3jgHS6p4e', 'Asdfgh', 'Asdfgh', '01987654321', 0.000, NULL, NULL, NULL, NULL, 0, 'bc9342f1c6370e6deaeaed72ebe10bdb', NULL, 0, 'n7oc9cHfGl6vPx1ns41lvcpEg', 'IhWePJTKsyLBsKQK7vvxnO3pllyRSxBW', '2025-03-11 04:49:30', '2025-03-11 04:49:30', '2025-03-11 20:15:28'),
(358, '66910a2996ae1ac782ee55e100155e09', 'bdbosstv@gmail.com', '$2y$10$7ZZGxTLKredSCswh1d9lOeN/2o4dHwpNHL5WLV2jv8QW5nPdccVRC', 'MD Leon', 'Islam', '01710604946', 0.000, NULL, NULL, NULL, NULL, 0, '589aea72d0e950e97b4a623192b35871', NULL, 1, 'h5CTlRJ0GCUlyK4V48tsnkeov', 'ImKFiVIzNaTOWsxE3VASUk7N3zWnx0d5', '2025-03-11 20:16:53', '2025-03-11 20:16:53', NULL),
(359, '0da1f6bd87768711d7654507a185cba8', 'hm8846888@gmail.com', '$2y$10$qrJJatCdf1YE/4kwnAhU4u268G1TJLK.0t7iO1wsXqDNx713awqa6', 'Nannu Islam', 'Maglin', '01400756900', 0.000, NULL, NULL, NULL, NULL, 0, 'a4e53acf544f0ed15495cd794e6e2610', NULL, 1, 'csL0vxqLOSKWUaHnp9MeGoRkz', 'CAXpcWLPWFdLnCJuDxqJ8gv7tcRVMCXH', '2025-03-13 20:38:25', '2025-03-13 20:38:25', NULL),
(360, 'ac38bc44a3899c0612ca2ea7514db5c3', 'khan.swadhin@gmail.com', '$2y$10$PvKFn/REIONkclnLX2ccs.1H5n2Jr5kH3lnxlyK1qS1VS2RrddAkS', 'Swadhin', 'Khan', '01823662233', 0.000, NULL, NULL, NULL, NULL, 0, 'c22f267d8da54c98ab68212783e35d00', NULL, 1, 'wlSfF1VnfCuezKReITKrDmyqo', 'HFPKQfRI3o2L3CBzVyGAtwAw8vbl0ENp', '2025-03-18 01:16:11', '2025-03-18 01:16:11', NULL),
(362, '86d114b24ddab0968c7789919a68f084', 'md0942479@gmail.com', '$2y$10$TOv6pUM8zN6flQ4l/3BxA.9RP9HBsDrpuBzDlPDLe0vzHIaMYiNHa', 'Md Rakibul', 'Islam', '01825607861', 0.000, NULL, NULL, NULL, NULL, 0, '34677716d253a3b044b9009bb9d3f5d2', NULL, 1, '7IrURblk9IsLQV9TLQZ7Ey427', 'jyYZK6bq5MXov7eAkLE9uU0Mjb2llP1r', '2025-05-09 21:41:18', '2025-05-09 21:41:18', NULL),
(363, 'b926bf58df40b4bed9baf459b44a96c8', 'rpdeveloperbd@gmail.com', '$2y$10$KIvv6LnCjkEUGlhyAGB6UObJmJczIQW/0593.a62Sw0iAvA0l8SSm', 'RP DEVELOPER', 'BD', '01871787476', 0.000, NULL, NULL, NULL, NULL, 0, '5bc09a3194ae129ee7bcd754666b82c1', NULL, 1, '4Y5NcFhDlOAQ8TKgfqdMaOXd4', 'ncCty3UUYgxcFwYCt5mRsXj7YsjftJhe', '2025-05-09 21:45:17', '2025-05-09 21:45:17', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_coupons`
--

CREATE TABLE `user_coupons` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `coupon_id` int(11) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `price` decimal(10,3) NOT NULL DEFAULT 0.000,
  `discount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_notifier`
--

CREATE TABLE `user_notifier` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `message` text DEFAULT NULL,
  `response` text DEFAULT NULL,
  `type` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=>mail, 1=>sms',
  `medium` varchar(50) NOT NULL COMMENT 'Mobile number or email',
  `status` tinyint(4) DEFAULT NULL,
  `charge` float DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `deleted_at` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_payment_settings`
--

CREATE TABLE `user_payment_settings` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `brand_id` int(10) NOT NULL,
  `g_type` varchar(255) DEFAULT NULL,
  `t_type` varchar(255) DEFAULT NULL,
  `status` int(2) NOT NULL DEFAULT 0,
  `params` text NOT NULL,
  `created_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_payment_settings`
--

INSERT INTO `user_payment_settings` (`id`, `uid`, `brand_id`, `g_type`, `t_type`, `status`, `params`, `created_at`, `deleted_at`) VALUES
(21, 1, 8, 'bkash', 'mobile', 1, '{\"status\":\"1\",\"brand_id\":\"8\",\"active_payments\":{\"personal\":\"0\",\"agent\":\"0\",\"merchant\":\"0\",\"payment\":\"0\"},\"personal_number\":\"\",\"payment_number\":\"\",\"agent_number\":\"\",\"sandbox\":\"0\",\"logs\":\"0\",\"username\":\"\",\"password\":\"\",\"app_key\":\"\",\"app_secret\":\"\"}', '2024-12-07 11:37:06', NULL),
(22, 1, 8, 'nagad', 'mobile', 1, '{\"status\":\"1\",\"brand_id\":\"8\",\"active_payments\":{\"personal\":\"0\",\"agent\":\"0\",\"merchant\":\"0\"},\"personal_number\":\"\",\"agent_number\":\"\",\"nagad_mode\":\"live\",\"merchant_id\":\"\",\"private_key\":\"\",\"public_key\":\"\"}', '2024-12-07 11:37:17', NULL),
(23, 1, 8, 'rocket', 'mobile', 1, '{\"status\":\"1\",\"brand_id\":\"8\",\"active_payments\":{\"personal\":\"0\",\"agent\":\"0\"},\"personal_number\":\"\",\"agent_number\":\"\",\"merchant_url\":\"\"}', '2024-12-07 11:37:25', NULL),
(24, 1, 8, 'upay', 'mobile', 1, '{\"status\":\"1\",\"brand_id\":\"8\",\"active_payments\":{\"personal\":\"0\",\"agent\":\"0\",\"merchant\":\"0\"},\"personal_number\":\"\",\"agent_number\":\"\",\"merchant_id\":\"\",\"merchant_key\":\"\",\"merchant_code\":\"\",\"merchant_name\":\"\"}', '2024-12-07 11:37:34', NULL),
(41, 358, 19, 'bkash', 'mobile', 1, '{\"status\":\"1\",\"brand_id\":\"19\",\"active_payments\":{\"personal\":\"1\",\"agent\":\"0\",\"merchant\":\"0\",\"payment\":\"0\"},\"personal_number\":\"01783632964\",\"payment_number\":\"\",\"agent_number\":\"\",\"sandbox\":\"0\",\"logs\":\"0\",\"username\":\"\",\"password\":\"\",\"app_key\":\"\",\"app_secret\":\"\"}', '2025-03-13 14:00:59', NULL),
(42, 358, 19, 'nagad', 'mobile', 1, '{\"status\":\"1\",\"brand_id\":\"19\",\"active_payments\":{\"personal\":\"1\",\"agent\":\"0\",\"merchant\":\"0\"},\"personal_number\":\"01710604946\",\"agent_number\":\"\",\"nagad_mode\":\"live\",\"merchant_id\":\"\",\"private_key\":\"\",\"public_key\":\"\"}', '2025-03-13 14:01:10', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_payouts`
--

CREATE TABLE `user_payouts` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `g_type` varchar(30) DEFAULT NULL,
  `params` text DEFAULT NULL,
  `amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `charge` decimal(10,3) NOT NULL DEFAULT 0.000,
  `net_amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=pending,1=initiated,2=success,3=cancel',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_plans`
--

CREATE TABLE `user_plans` (
  `id` int(10) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `plan_id` int(10) NOT NULL,
  `price` decimal(10,3) NOT NULL DEFAULT 0.000,
  `brand` int(10) NOT NULL,
  `device` int(10) NOT NULL,
  `transaction` int(10) NOT NULL,
  `key` varchar(100) NOT NULL,
  `expire` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_plans`
--

INSERT INTO `user_plans` (`id`, `uid`, `plan_id`, `price`, `brand`, `device`, `transaction`, `key`, `expire`, `created_at`, `updated_at`, `deleted_at`) VALUES
(20, 1, 7, 1500.000, 10, 15, -1, '', '2025-12-07 11:17:25', '2024-12-07 11:17:25', '2024-12-07 11:17:25', NULL),
(33, 358, 14, 0.000, 1, 1, -1, '', '2025-03-18 20:17:04', '2025-03-11 20:17:04', '2025-03-11 20:17:04', NULL),
(34, 360, 14, 0.000, 1, 1, -1, '', '2025-03-25 03:59:32', '2025-03-18 03:59:32', '2025-03-18 03:59:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `permissions` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `name`, `permissions`, `created_at`) VALUES
(1, 'Admin', '{\"id\":\"14\",\"name\":\"Admin\",\"dashboard_statistics\":\"on\",\"dashboard_bar_chart\":\"on\",\"dashboard_latest_transactions\":\"on\",\"user_access_user\":\"on\",\"user_add_user\":\"on\",\"user_edit_user\":\"on\",\"user_add_fund_user\":\"on\",\"user_send_mail_user\":\"on\",\"user_detail_user\":\"on\",\"user_access_transaction\":\"on\",\"invoice_access_invoice\":\"on\",\"invoice_view_invoice\":\"on\",\"invoice_add_invoice\":\"on\",\"invoice_edit_invoice\":\"on\",\"domain_access_domain\":\"on\",\"domain_edit_domain\":\"on\",\"device_access_device\":\"on\",\"device_edit_device\":\"on\",\"plan_access_plan\":\"on\",\"plan_access_user_plan\":\"on\",\"plan_add_plan\":\"on\",\"plan_edit_plan\":\"on\",\"setting_access_setting\":\"on\",\"setting_access_payment_setting\":\"on\",\"setting_access_faq\":\"on\",\"setting_access_coupon\":\"on\",\"setting_add_coupon\":\"on\",\"setting_edit_coupon\":\"on\",\"setting_access_blog\":\"on\",\"setting_developer\":\"on\",\"setting_access_tickets\":\"on\",\"setting_databackup\":\"on\"}', NULL),
(2, 'Owner', '{\"id\":\"\",\"name\":\"Owner\",\"dashboard_statistics\":\"on\",\"dashboard_bar_chart\":\"on\",\"dashboard_latest_transactions\":\"on\",\"user_access_user\":\"on\",\"user_add_user\":\"on\",\"user_edit_user\":\"on\",\"user_delete_user\":\"on\",\"user_view_user\":\"on\",\"user_add_fund_user\":\"on\",\"user_send_mail_user\":\"on\",\"user_set_password_user\":\"on\",\"user_detail_user\":\"on\",\"user_access_transaction\":\"on\",\"invoice_access_invoice\":\"on\",\"invoice_view_invoice\":\"on\",\"invoice_add_invoice\":\"on\",\"invoice_edit_invoice\":\"on\",\"invoice_delete_invoice\":\"on\",\"domain_access_domain\":\"on\",\"domain_edit_domain\":\"on\",\"domain_delete_domain\":\"on\",\"device_access_device\":\"on\",\"device_edit_device\":\"on\",\"device_delete_device\":\"on\",\"plan_access_plan\":\"on\",\"plan_access_user_plan\":\"on\",\"plan_add_plan\":\"on\",\"plan_edit_plan\":\"on\",\"plan_delete_plan\":\"on\",\"setting_access_setting\":\"on\",\"setting_access_payment_setting\":\"on\",\"setting_access_staff\":\"on\",\"setting_access_role\":\"on\",\"setting_acess_activity\":\"on\",\"setting_access_faq\":\"on\",\"setting_access_coupon\":\"on\",\"setting_add_coupon\":\"on\",\"setting_edit_coupon\":\"on\",\"setting_delete_coupon\":\"on\",\"setting_access_blog\":\"on\",\"setting_developer\":\"on\",\"setting_access_tickets\":\"on\",\"setting_databackup\":\"on\"}', NULL),
(3, 'Support Operator', '{\"id\":\"17\",\"name\":\"Support Operator\",\"user_access_user\":\"on\",\"user_add_user\":\"on\",\"user_add_fund_user\":\"on\",\"invoice_access_invoice\":\"on\",\"invoice_view_invoice\":\"on\",\"invoice_add_invoice\":\"on\",\"domain_access_domain\":\"on\",\"domain_edit_domain\":\"on\",\"device_access_device\":\"on\",\"plan_access_user_plan\":\"on\"}', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_transactions`
--

CREATE TABLE `user_transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `ids` text NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `information` text DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `currency` varchar(10) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=pending,1=initiated,2=success,3=cancel',
  `transaction_id` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_transactions`
--

INSERT INTO `user_transactions` (`id`, `ids`, `uid`, `information`, `type`, `amount`, `currency`, `status`, `transaction_id`, `created_at`, `updated_at`) VALUES
(38, '45de7e1acdda017a2b7794a60ccb916c', 358, '{\"message\":\"Your purchase of plan \\u09ab\\u09cd\\u09b0\\u09bf \\u09ed \\u09a6\\u09bf\\u09a8! for\\u09f30.00 taka with a discount of \\u09f30.00 is successful\"}', 'plan', 0.000, 'BDT', 2, 'CT85UT702624', '2025-03-11 20:17:04', '2025-03-11 20:17:04'),
(39, '060439d59cecae58a70efc676403d99f', 360, '{\"message\":\"Your purchase of plan \\u09ab\\u09cd\\u09b0\\u09bf \\u09ed \\u09a6\\u09bf\\u09a8! for\\u09f30.00 taka with a discount of \\u09f30.00 is successful\"}', 'plan', 0.000, 'BDT', 2, '3HPD5M248772', '2025-03-18 03:59:32', '2025-03-18 03:59:32');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_uid_foreign` (`uid`);

--
-- Indexes for table `addons`
--
ALTER TABLE `addons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_activity_logs_uid_foreign` (`uid`);

--
-- Indexes for table `affiliates`
--
ALTER TABLE `affiliates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `affiliates_uid_foreign` (`uid`),
  ADD KEY `affiliates_ref_id_foreign` (`ref_id`);

--
-- Indexes for table `bank_transaction_logs`
--
ALTER TABLE `bank_transaction_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_transaction_logs_uid_foreign` (`uid`);

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD KEY `brands_uid_foreign` (`uid`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `devices_uid_foreign` (`uid`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `file_managers`
--
ALTER TABLE `file_managers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoice`
--
ALTER TABLE `invoice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_uid_foreign` (`uid`);

--
-- Indexes for table `kyc`
--
ALTER TABLE `kyc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kyc_uid_foreign` (`uid`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `module_data`
--
ALTER TABLE `module_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_data_uid_foreign` (`uid`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_uid_foreign` (`uid`);

--
-- Indexes for table `options`
--
ALTER TABLE `options`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `queue`
--
ALTER TABLE `queue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staffs`
--
ALTER TABLE `staffs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ids` (`ids`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `temp_transactions`
--
ALTER TABLE `temp_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `temp_transactions_uid_foreign` (`uid`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tickets_uid_foreign` (`uid`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transactions_uid_foreign` (`uid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ids` (`ids`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_notifier`
--
ALTER TABLE `user_notifier`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_notifier_uid_foreign` (`uid`);

--
-- Indexes for table `user_payment_settings`
--
ALTER TABLE `user_payment_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_payment_settings_uid_foreign` (`uid`);

--
-- Indexes for table `user_payouts`
--
ALTER TABLE `user_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_payouts_uid_foreign` (`uid`);

--
-- Indexes for table `user_plans`
--
ALTER TABLE `user_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_plans_uid_foreign` (`uid`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_transactions`
--
ALTER TABLE `user_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_transactions_uid_foreign` (`uid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `addons`
--
ALTER TABLE `addons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `affiliates`
--
ALTER TABLE `affiliates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_transaction_logs`
--
ALTER TABLE `bank_transaction_logs`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `file_managers`
--
ALTER TABLE `file_managers`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `invoice`
--
ALTER TABLE `invoice`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `kyc`
--
ALTER TABLE `kyc`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `module_data`
--
ALTER TABLE `module_data`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `options`
--
ALTER TABLE `options`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=129;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `plans`
--
ALTER TABLE `plans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `queue`
--
ALTER TABLE `queue`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staffs`
--
ALTER TABLE `staffs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `templates`
--
ALTER TABLE `templates`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `temp_transactions`
--
ALTER TABLE `temp_transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=364;

--
-- AUTO_INCREMENT for table `user_coupons`
--
ALTER TABLE `user_coupons`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_notifier`
--
ALTER TABLE `user_notifier`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_payment_settings`
--
ALTER TABLE `user_payment_settings`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `user_payouts`
--
ALTER TABLE `user_payouts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_plans`
--
ALTER TABLE `user_plans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_transactions`
--
ALTER TABLE `user_transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD CONSTRAINT `admin_activity_logs_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `staffs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `affiliates`
--
ALTER TABLE `affiliates`
  ADD CONSTRAINT `affiliates_ref_id_foreign` FOREIGN KEY (`ref_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `affiliates_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bank_transaction_logs`
--
ALTER TABLE `bank_transaction_logs`
  ADD CONSTRAINT `bank_transaction_logs_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `brands`
--
ALTER TABLE `brands`
  ADD CONSTRAINT `brands_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `devices`
--
ALTER TABLE `devices`
  ADD CONSTRAINT `devices_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoice`
--
ALTER TABLE `invoice`
  ADD CONSTRAINT `invoice_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kyc`
--
ALTER TABLE `kyc`
  ADD CONSTRAINT `kyc_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `module_data`
--
ALTER TABLE `module_data`
  ADD CONSTRAINT `module_data_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `temp_transactions`
--
ALTER TABLE `temp_transactions`
  ADD CONSTRAINT `temp_transactions_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notifier`
--
ALTER TABLE `user_notifier`
  ADD CONSTRAINT `user_notifier_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_payment_settings`
--
ALTER TABLE `user_payment_settings`
  ADD CONSTRAINT `user_payment_settings_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_payouts`
--
ALTER TABLE `user_payouts`
  ADD CONSTRAINT `user_payouts_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_plans`
--
ALTER TABLE `user_plans`
  ADD CONSTRAINT `user_plans_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_transactions`
--
ALTER TABLE `user_transactions`
  ADD CONSTRAINT `user_transactions_uid_foreign` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
