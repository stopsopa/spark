-- --------------------------------------------------------
-- Host:                         172.20.0.30
-- Server version:               5.5.54-0ubuntu0.14.04.1 - (Ubuntu)
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             9.3.0.4984
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping structure for table spark.spark_cache
CREATE TABLE IF NOT EXISTS `spark_cache` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `url` longtext COLLATE utf8_unicode_ci NOT NULL,
  `html` longtext COLLATE utf8_unicode_ci NOT NULL,
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL,
  `updateRequest` datetime DEFAULT NULL,
  `statusCode` int(10) unsigned DEFAULT NULL,
  `json` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `warning` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `errorCounter` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hash_index` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.


-- Dumping structure for table spark.spark_domain
CREATE TABLE IF NOT EXISTS `spark_domain` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.


-- Dumping structure for table spark.spark_settings
CREATE TABLE IF NOT EXISTS `spark_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `domain_id` int(10) unsigned NOT NULL,
  `key` varchar(50) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_spark_settings_spark_domain` (`domain_id`),
  CONSTRAINT `FK_spark_settings_spark_domain` FOREIGN KEY (`domain_id`) REFERENCES `spark_domain` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
