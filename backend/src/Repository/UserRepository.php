<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->flush();
    }

    /**
     * Search users by name or email (for member search)
     *
     * @return User[]
     */
    public function searchUsers(string $query, int $limit = 10): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.email LIKE :query')
            ->orWhere('u.firstName LIKE :query')
            ->orWhere('u.lastName LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->setMaxResults($limit)
            ->orderBy('u.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find users not yet members of a project
     *
     * @return User[]
     */
    public function findNonMembers(int $projectId, string $query = '', int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('u')
            ->leftJoin('u.memberProjects', 'mp')
            ->leftJoin('mp.owner', 'po')
            ->where('mp.id != :projectId OR mp.id IS NULL')
            ->setParameter('projectId', $projectId);

        if ($query) {
            $qb->andWhere('u.email LIKE :query OR u.firstName LIKE :query OR u.lastName LIKE :query')
               ->setParameter('query', '%' . $query . '%');
        }

        return $qb->setMaxResults($limit)
            ->orderBy('u.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
