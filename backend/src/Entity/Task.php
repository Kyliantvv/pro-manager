<?php

namespace App\Entity;

use App\Repository\TaskRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TaskRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Task
{
    public const STATUS_TODO        = 'todo';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_REVIEW      = 'review';
    public const STATUS_DONE        = 'done';

    public const PRIORITY_LOW    = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH   = 'high';
    public const PRIORITY_URGENT = 'urgent';

    public const VALID_STATUSES   = [self::STATUS_TODO, self::STATUS_IN_PROGRESS, self::STATUS_REVIEW, self::STATUS_DONE];
    public const VALID_PRIORITIES = [self::PRIORITY_LOW, self::PRIORITY_MEDIUM, self::PRIORITY_HIGH, self::PRIORITY_URGENT];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Task title is required.')]
    #[Assert\Length(
        min: 2,
        max: 255,
        minMessage: 'Title must be at least {{ limit }} characters.',
        maxMessage: 'Title cannot exceed {{ limit }} characters.'
    )]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 5000, maxMessage: 'Description cannot exceed {{ limit }} characters.')]
    private ?string $description = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Status is required.')]
    #[Assert\Choice(choices: self::VALID_STATUSES, message: 'Invalid status value.')]
    private string $status = self::STATUS_TODO;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Priority is required.')]
    #[Assert\Choice(choices: self::VALID_PRIORITIES, message: 'Invalid priority value.')]
    private string $priority = self::PRIORITY_MEDIUM;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 0;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dueDate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 5, scale: 2, nullable: true)]
    #[Assert\PositiveOrZero(message: 'Estimated hours must be 0 or greater.')]
    #[Assert\LessThanOrEqual(value: 999.99, message: 'Estimated hours cannot exceed 999.99.')]
    private ?string $estimatedHours = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(targetEntity: Project::class, inversedBy: 'tasks')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Project $project = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'assignedTasks')]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $assignee = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'createdTasks')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $creator = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getPriority(): string
    {
        return $this->priority;
    }

    public function setPriority(string $priority): static
    {
        $this->priority = $priority;
        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;
        return $this;
    }

    public function getDueDate(): ?\DateTimeImmutable
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeImmutable $dueDate): static
    {
        $this->dueDate = $dueDate;
        return $this;
    }

    public function getEstimatedHours(): ?string
    {
        return $this->estimatedHours;
    }

    public function setEstimatedHours(?string $estimatedHours): static
    {
        $this->estimatedHours = $estimatedHours;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getProject(): ?Project
    {
        return $this->project;
    }

    public function setProject(?Project $project): static
    {
        $this->project = $project;
        return $this;
    }

    public function getAssignee(): ?User
    {
        return $this->assignee;
    }

    public function setAssignee(?User $assignee): static
    {
        $this->assignee = $assignee;
        return $this;
    }

    public function getCreator(): ?User
    {
        return $this->creator;
    }

    public function setCreator(?User $creator): static
    {
        $this->creator = $creator;
        return $this;
    }

    public function isOverdue(): bool
    {
        return $this->dueDate !== null
            && $this->status !== self::STATUS_DONE
            && $this->dueDate < new \DateTimeImmutable('today');
    }
}
