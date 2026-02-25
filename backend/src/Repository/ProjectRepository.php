<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Project>
 */
class ProjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Project::class);
    }

    /**
     * Find projects accessible by a user (owned + member) with filters and pagination.
     *
     * @return array{projects: Project[], total: int}
     */
    public function findByUserWithFilters(
        User   $user,
        int    $page     = 1,
        int    $limit    = 10,
        ?string $status  = null,
        ?string $priority = null,
        ?string $search  = null,
        string $sort     = 'createdAt',
        string $order    = 'DESC'
    ): array {
        $allowedSort  = ['createdAt', 'updatedAt', 'name', 'dueDate', 'priority', 'status'];
        $allowedOrder = ['ASC', 'DESC'];

        if (!in_array($sort, $allowedSort, true)) {
            $sort = 'createdAt';
        }
        if (!in_array($order, $allowedOrder, true)) {
            $order = 'DESC';
        }

        $qb = $this->createQueryBuilder('p')
            ->leftJoin('p.members', 'm')
            ->addSelect('COUNT(t.id) AS HIDDEN taskCount')
            ->leftJoin('p.tasks', 't')
            ->where('p.owner = :user OR m.id = :userId')
            ->setParameter('user', $user)
            ->setParameter('userId', $user->getId())
            ->groupBy('p.id');

        if ($status) {
            $qb->andWhere('p.status = :status')->setParameter('status', $status);
        }

        if ($priority) {
            $qb->andWhere('p.priority = :priority')->setParameter('priority', $priority);
        }

        if ($search) {
            $qb->andWhere('p.name LIKE :search OR p.description LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }

        // Count total (before pagination)
        $countQb = clone $qb;
        $total   = count($countQb->getQuery()->getResult());

        // Apply sort and pagination
        $qb->orderBy('p.' . $sort, $order)
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        return [
            'projects' => $qb->getQuery()->getResult(),
            'total'    => $total,
        ];
    }

    /**
     * Find a project accessible by a given user (owner or member)
     */
    public function findAccessibleById(int $id, User $user): ?Project
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.members', 'm')
            ->where('p.id = :id')
            ->andWhere('p.owner = :user OR m.id = :userId')
            ->setParameter('id', $id)
            ->setParameter('user', $user)
            ->setParameter('userId', $user->getId())
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Get project statistics for a user's dashboard
     */
    public function getStatsByUser(User $user): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select([
                'COUNT(p.id) AS total',
                "SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active",
                "SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed",
                "SUM(CASE WHEN p.status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold",
            ])
            ->leftJoin('p.members', 'm')
            ->where('p.owner = :user OR m.id = :userId')
            ->setParameter('user', $user)
            ->setParameter('userId', $user->getId());

        return $qb->getQuery()->getOneOrNullResult() ?? ['total' => 0, 'active' => 0, 'completed' => 0, 'on_hold' => 0];
    }
}
