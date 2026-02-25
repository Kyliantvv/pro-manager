<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['email'], message: 'This email address is already in use.')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank(message: 'Email is required.')]
    #[Assert\Email(message: 'Please provide a valid email address.')]
    #[Assert\Length(max: 180, maxMessage: 'Email cannot exceed {{ limit }} characters.')]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    #[Assert\NotBlank(message: 'Password is required.', groups: ['create'])]
    #[Assert\Length(
        min: 8,
        max: 255,
        minMessage: 'Password must be at least {{ limit }} characters.',
        maxMessage: 'Password cannot exceed {{ limit }} characters.'
    )]
    private ?string $plainPassword = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'First name is required.')]
    #[Assert\Length(min: 2, max: 100, minMessage: 'First name must be at least {{ limit }} characters.')]
    private ?string $firstName = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Last name is required.')]
    #[Assert\Length(min: 2, max: 100, minMessage: 'Last name must be at least {{ limit }} characters.')]
    private ?string $lastName = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 500, maxMessage: 'Bio cannot exceed {{ limit }} characters.')]
    private ?string $bio = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'owner', targetEntity: Project::class, orphanRemoval: true)]
    private Collection $ownedProjects;

    #[ORM\ManyToMany(targetEntity: Project::class, mappedBy: 'members')]
    private Collection $memberProjects;

    #[ORM\OneToMany(mappedBy: 'assignee', targetEntity: Task::class)]
    private Collection $assignedTasks;

    #[ORM\OneToMany(mappedBy: 'creator', targetEntity: Task::class)]
    private Collection $createdTasks;

    public function __construct()
    {
        $this->ownedProjects = new ArrayCollection();
        $this->memberProjects = new ArrayCollection();
        $this->assignedTasks = new ArrayCollection();
        $this->createdTasks = new ArrayCollection();
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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getPlainPassword(): ?string
    {
        return $this->plainPassword;
    }

    public function setPlainPassword(?string $plainPassword): static
    {
        $this->plainPassword = $plainPassword;
        return $this;
    }

    public function eraseCredentials(): void
    {
        $this->plainPassword = null;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getFullName(): string
    {
        return trim($this->firstName . ' ' . $this->lastName);
    }

    public function getInitials(): string
    {
        return strtoupper(substr($this->firstName ?? '', 0, 1) . substr($this->lastName ?? '', 0, 1));
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): static
    {
        $this->avatar = $avatar;
        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;
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

    public function getOwnedProjects(): Collection
    {
        return $this->ownedProjects;
    }

    public function getMemberProjects(): Collection
    {
        return $this->memberProjects;
    }

    public function getAssignedTasks(): Collection
    {
        return $this->assignedTasks;
    }

    public function getCreatedTasks(): Collection
    {
        return $this->createdTasks;
    }
}
