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

-- Dumping structure for table databasename.spark_cache
CREATE TABLE IF NOT EXISTS `spark_cache` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `url` longtext COLLATE utf8_unicode_ci NOT NULL,
  `html` longtext COLLATE utf8_unicode_ci NOT NULL,
  `updated` datetime NOT NULL,
  `statusCode` int(10) unsigned DEFAULT NULL,
  `json` longtext COLLATE utf8_unicode_ci,
  `attempts` int(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `hash_index` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table databasename.spark_cache: ~0 rows (approximately)
DELETE FROM `spark_cache`;
/*!40000 ALTER TABLE `spark_cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `spark_cache` ENABLE KEYS */;


-- Dumping structure for table databasename.spark_domain
CREATE TABLE IF NOT EXISTS `spark_domain` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table databasename.spark_domain: ~0 rows (approximately)
DELETE FROM `spark_domain`;
/*!40000 ALTER TABLE `spark_domain` DISABLE KEYS */;
/*!40000 ALTER TABLE `spark_domain` ENABLE KEYS */;


-- Dumping structure for table databasename.spark_settings
CREATE TABLE IF NOT EXISTS `spark_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `domain_id` int(10) unsigned NOT NULL,
  `key` varchar(50) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_spark_settings_spark_domain` (`domain_id`),
  CONSTRAINT `FK_spark_settings_spark_domain` FOREIGN KEY (`domain_id`) REFERENCES `spark_domain` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table databasename.spark_settings: ~0 rows (approximately)
DELETE FROM `spark_settings`;
/*!40000 ALTER TABLE `spark_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `spark_settings` ENABLE KEYS */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
