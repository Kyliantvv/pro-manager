<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Initial migration – creates user, project, task, and project_member tables.
 */
final class Version20240101000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create initial schema: user, project, task, project_member';
    }

    public function up(Schema $schema): void
    {
        // user table
        $this->addSql('CREATE TABLE `user` (
            id             INT AUTO_INCREMENT NOT NULL,
            email          VARCHAR(180) NOT NULL,
            roles          JSON NOT NULL,
            password       VARCHAR(255) NOT NULL,
            first_name     VARCHAR(100) NOT NULL,
            last_name      VARCHAR(100) NOT NULL,
            avatar         VARCHAR(255) DEFAULT NULL,
            bio            LONGTEXT DEFAULT NULL,
            created_at     DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at     DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX UNIQ_8D93D649E7927C74 (email),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // project table
        $this->addSql('CREATE TABLE project (
            id          INT AUTO_INCREMENT NOT NULL,
            owner_id    INT NOT NULL,
            name        VARCHAR(255) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            status      VARCHAR(20) NOT NULL,
            priority    VARCHAR(20) NOT NULL,
            color       VARCHAR(7) NOT NULL,
            due_date    DATE DEFAULT NULL COMMENT \'(DC2Type:date_immutable)\',
            created_at  DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at  DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            INDEX IDX_2FB3D0EE7E3C61F9 (owner_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // project_member pivot table
        $this->addSql('CREATE TABLE project_member (
            project_id INT NOT NULL,
            user_id    INT NOT NULL,
            INDEX IDX_B3B98C59166D1F9C (project_id),
            INDEX IDX_B3B98C59A76ED395 (user_id),
            PRIMARY KEY(project_id, user_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // task table
        $this->addSql('CREATE TABLE task (
            id               INT AUTO_INCREMENT NOT NULL,
            project_id       INT NOT NULL,
            assignee_id      INT DEFAULT NULL,
            creator_id       INT NOT NULL,
            title            VARCHAR(255) NOT NULL,
            description      LONGTEXT DEFAULT NULL,
            status           VARCHAR(20) NOT NULL,
            priority         VARCHAR(20) NOT NULL,
            position         INT NOT NULL,
            due_date         DATE DEFAULT NULL COMMENT \'(DC2Type:date_immutable)\',
            estimated_hours  NUMERIC(5, 2) DEFAULT NULL,
            created_at       DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at       DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            INDEX IDX_527EDB25166D1F9C (project_id),
            INDEX IDX_527EDB2559EC7D60 (assignee_id),
            INDEX IDX_527EDB2561220EA6 (creator_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Foreign keys
        $this->addSql('ALTER TABLE project ADD CONSTRAINT FK_2FB3D0EE7E3C61F9 FOREIGN KEY (owner_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE project_member ADD CONSTRAINT FK_B3B98C59166D1F9C FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE project_member ADD CONSTRAINT FK_B3B98C59A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE task ADD CONSTRAINT FK_527EDB25166D1F9C FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE task ADD CONSTRAINT FK_527EDB2559EC7D60 FOREIGN KEY (assignee_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE task ADD CONSTRAINT FK_527EDB2561220EA6 FOREIGN KEY (creator_id) REFERENCES `user` (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE task DROP FOREIGN KEY FK_527EDB25166D1F9C');
        $this->addSql('ALTER TABLE task DROP FOREIGN KEY FK_527EDB2559EC7D60');
        $this->addSql('ALTER TABLE task DROP FOREIGN KEY FK_527EDB2561220EA6');
        $this->addSql('ALTER TABLE project_member DROP FOREIGN KEY FK_B3B98C59166D1F9C');
        $this->addSql('ALTER TABLE project_member DROP FOREIGN KEY FK_B3B98C59A76ED395');
        $this->addSql('ALTER TABLE project DROP FOREIGN KEY FK_2FB3D0EE7E3C61F9');
        $this->addSql('DROP TABLE task');
        $this->addSql('DROP TABLE project_member');
        $this->addSql('DROP TABLE project');
        $this->addSql('DROP TABLE `user`');
    }
}
