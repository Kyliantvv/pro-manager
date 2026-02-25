<?php

namespace App\Entity;

use App\Repository\ProjectRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ProjectRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Project
{
    public const STATUS_PLANNING   = 'planning';
    public const STATUS_ACTIVE     = 'active';
    public const STATUS_ON_HOLD    = 'on_hold';
    public const STATUS_COMPLETED  = 'completed';
    public const STATUS_ARCHIVED   = 'archived';

    public const PRIORITY_LOW    = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH   = 'high';

    public const VALID_STATUSES   = [self::STATUS_PLANNING, self::STATUS_ACTIVE, self::STATUS_ON_HOLD, self::STATUS_COMPLETED, self::STATUS_ARCHIVED];
    public const VALID_PRIORITIES = [self::PRIORITY_LOW, self::PRIORITY_MEDIUM, self::PRIORITY_HIGH];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Project name is required.')]
    #[Assert\Length(
        min: 2,
        max: 255,
        minMessage: 'Project name must be at least {{ limit }} characters.',
        maxMessage: 'Project name cannot exceed {{ limit }} characters.'
    )]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 2000, maxMessage: 'Description cannot exceed {{ limit }} characters.')]
    private ?string $description = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Status is required.')]
    #[Assert\Choice(choices: self::VALID_STATUSES, message: 'Invalid status value.')]
    private string $status = self::STATUS_PLANNING;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Priority is required.')]
    #[Assert\Choice(choices: self::VALID_PRIORITIES, message: 'Invalid priority value.')]
    private string $priority = self::PRIORITY_MEDIUM;

    #[ORM\Column(length: 7)]
    #[Assert\NotBlank(message: 'Color is required.')]
    #[Assert\Regex(pattern: '/^#[0-9A-Fa-f]{6}$/', message: 'Color must be a valid hex color (e.g. #6366f1).')]
    private string $color = '#6366f1';

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dueDate = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'ownedProjects')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $owner = null;

    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'memberProjects')]
    #[ORM\JoinTable(name: 'project_member')]
    private Collection $members;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: Task::class, orphanRemoval: true, cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['position' => 'ASC', 'createdAt' => 'DESC'])]
    private Collection $tasks;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->tasks   = new ArrayCollection();
    }

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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
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

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;
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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
        return $this;
    }

    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(User $member): static
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
        }
        return $this;
    }

    public function removeMember(User $member): static
    {
        $this->members->removeElement($member);
        return $this;
    }

    public function isMember(User $user): bool
    {
        return $this->owner === $user || $this->members->contains($user);
    }

    public function getTasks(): Collection
    {
        return $this->tasks;
    }

    public function addTask(Task $task): static
    {
        if (!$this->tasks->contains($task)) {
            $this->tasks->add($task);
            $task->setProject($this);
        }
        return $this;
    }

    public function removeTask(Task $task): static
    {
        if ($this->tasks->removeElement($task)) {
            if ($task->getProject() === $this) {
                $task->setProject(null);
            }
        }
        return $this;
    }

    public function getCompletionPercentage(): float
    {
        $total = $this->tasks->count();
        if ($total === 0) {
            return 0.0;
        }
        $done = $this->tasks->filter(fn(Task $t) => $t->getStatus() === Task::STATUS_DONE)->count();
        return round(($done / $total) * 100, 1);
    }
}
