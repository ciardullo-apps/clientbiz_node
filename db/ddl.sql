-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema clientbiz
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema clientbiz
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `clientbiz` DEFAULT CHARACTER SET utf8 ;
USE `clientbiz` ;

-- -----------------------------------------------------
-- Table `clientbiz`.`clientele`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientbiz`.`clientele` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `firstname` VARCHAR(45) NOT NULL,
  `lastname` VARCHAR(45) NOT NULL,
  `contactname` VARCHAR(45) NULL,
  `city` VARCHAR(45) NOT NULL,
  `state` CHAR(2) NOT NULL,
  `timezone` VARCHAR(45) NOT NULL,
  `firstcontact` DATETIME NULL,
  `firstresponse` DATETIME NOT NULL,
  `solicited` VARCHAR(45) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `clientbiz`.`topic`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientbiz`.`topic` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `clientbiz`.`clienttopic`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientbiz`.`clienttopic` (
  `client_id` INT NOT NULL,
  `topic_id` INT NOT NULL,
  INDEX `fk_clienttopic_client_idx` (`client_id` ASC),
  PRIMARY KEY (`client_id`, `topic_id`),
  INDEX `fk_clienttopic_topic_idx` (`topic_id` ASC),
  CONSTRAINT `fk_clienttopic_client`
    FOREIGN KEY (`client_id`)
    REFERENCES `clientbiz`.`clientele` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_clienttopic_topic`
    FOREIGN KEY (`topic_id`)
    REFERENCES `clientbiz`.`topic` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `clientbiz`.`appointment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientbiz`.`appointment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `client_id` INT NOT NULL,
  `topic_id` INT NOT NULL,
  `starttime` DATETIME NOT NULL,
  `duration` INT NOT NULL,
  `description` VARCHAR(500) NULL,
  `rate` DECIMAL(5,2) NOT NULL,
  `billingpct` DECIMAL(3,2) NOT NULL,
  `paid` DATE NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_lesson_clienttopic1_idx` (`client_id` ASC, `topic_id` ASC),
  CONSTRAINT `fk_lesson_clienttopic1`
    FOREIGN KEY (`client_id` , `topic_id`)
    REFERENCES `clientbiz`.`clienttopic` (`client_id` , `topic_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
