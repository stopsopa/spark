-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               5.7.17-0ubuntu0.16.04.1 - (Ubuntu)
-- Server OS:                    Linux
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping structure for table spark.spark_cache

DROP TABLE IF EXISTS `spark_cache`;
CREATE TABLE IF NOT EXISTS `spark_cache` (
  `id` varchar(40) NOT NULL COMMENT 'Hash from full url',
  `url` longtext NOT NULL,
  `html` longtext,
  `created` datetime NOT NULL COMMENT 'When link was found/created for the first time',
  `updated` datetime DEFAULT NULL,
  `updateRequest` datetime DEFAULT NULL COMMENT 'Flat to prerender again',
  `lastTimeFound` datetime DEFAULT NULL COMMENT 'Link last time found on other page',
  `statusCode` int(3) unsigned DEFAULT NULL,
  `json` longtext,
  `warning` varchar(10) DEFAULT NULL,
  `errorCounter` int(3) unsigned DEFAULT NULL,
  `excluded` datetime DEFAULT NULL COMMENT 'Link excluded from further prerendering',
  `settings` longtext COMMENT '''export'' - will be exported with config, json - override settings and will be exported',
  PRIMARY KEY (`id`),
  KEY `hash_index` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
