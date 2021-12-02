SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `exifs` (
   `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
   `sourceFile` varchar(255) NOT NULL UNIQUE,
  `imageHeight` int DEFAULT NULL,
  `imageWidth` int DEFAULT NULL,
  `fileType` varchar(255) DEFAULT NULL,
  `fileTypeExtension` varchar(255) DEFAULT NULL,
  `mimeType` varchar(255) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `outputFile` varchar(255) DEFAULT NULL,
  `fileSize` varchar(255) DEFAULT NULL,
  `modifiedYear` varchar(255) DEFAULT NULL,
  `modifiedMonth` varchar(255) DEFAULT NULL,
  `modifiedDay` varchar(255) DEFAULT NULL,
  `createdYear` varchar(255) DEFAULT NULL,
  `createdMonth` varchar(255) DEFAULT NULL,
  `createdDay` varchar(255) DEFAULT NULL,
  `hash` varchar(255) DEFAULT NULL,
  `pHash` varchar(255) DEFAULT NULL,
  `isDuplicate` tinyint(1) NOT NULL DEFAULT '1',
  `hasMoved` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `hash_index` (`sourceFile`, `hash`) USING BTREE
  KEY `pHash_index` (`sourceFile`,`pHash`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

COMMIT;
