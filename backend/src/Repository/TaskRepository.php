<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    /**
     * Find tasks for a project with filters and pagination.
     *
     * @return array{tasks: Task[], total: int}
     */
    public function findByProjectWithFilters(
        Project  $project,
        int      $page      = 1,
        int      $limit     = 50,
        ?string  $status    = null,
        ?string  $priority  = null,
        ?int     $assigneeId = null,
        ?string  $search    = null,
        string   $sort      = 'position',
        string   $order     = 'ASC'
    ): array {
        $allowedSort  = ['position', 'createdAt', 'updatedAt', 'title', 'priority', 'status', 'dueDate'];
        $allowedOrder = ['ASC', 'DESC'];

        if (!in_array($sort, $allowedSort, true)) {
            $sort = 'position';
        }
        if (!in_array($order, $allowedOrder, true)) {
            $order = 'ASC';
        }

        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.assignee', 'a')
            ->leftJoin('t.creator', 'c')
            ->addSelect('a', 'c')
            ->where('t.project = :project')
            ->setParameter('project', $project);

        if ($status) {
            $qb->andWhere('t.status = :status')->setParameter('status', $status);
        }

        if ($priority) {
            $qb->andWhere('t.priority = :priority')->setParameter('priority', $priority);
        }

        if ($assigneeId) {
            $qb->andWhere('a.id = :assigneeId')->setParameter('assigneeId', $assigneeId);
        }

        if ($search) {
            $qb->andWhere('t.title LIKE :search OR t.description LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }

        $countQb = clone $qb;
        $total   = count($countQb->getQuery()->getResult());

        $qb->orderBy('t.' . $sort, $order)
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        return [
            'tasks' => $qb->getQuery()->getResult(),
            'total' => $total,
        ];
    }

    /**
     * Get all tasks grouped by status for a Kanban board view
     *
     * @return array<string, Task[]>
     */
    public function findKanbanByProject(Project $project): array
    {
        $tasks = $this->createQueryBuilder('t')
            ->leftJoin('t.assignee', 'a')
            ->leftJoin('t.creator', 'c')
            ->addSelect('a', 'c')
            ->where('t.project = :project')
            ->setParameter('project', $project)
            ->orderBy('t.position', 'ASC')
            ->addOrderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $grouped = [
            Task::STATUS_TODO        => [],
            Task::STATUS_IN_PROGRESS => [],
            Task::STATUS_REVIEW      => [],
            Task::STATUS_DONE        => [],
        ];

        foreach ($tasks as $task) {
            $grouped[$task->getStatus()][] = $task;
        }

        return $grouped;
    }

    /**
     * Get the next position value for a given status column
     */
    public function getNextPosition(Project $project, string $status): int
    {
        $result = $this->createQueryBuilder('t')
            ->select('MAX(t.position)')
            ->where('t.project = :project')
            ->andWhere('t.status = :status')
            ->setParameter('project', $project)
            ->setParameter('status', $status)
            ->getQuery()
            ->getSingleScalarResult();

        return ($result ?? 0) + 1;
    }

    /**
     * Find tasks assigned to a user across all projects
     *
     * @return Task[]
     */
    public function findByAssignee(User $user, int $limit = 10): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.project', 'p')
            ->addSelect('p')
            ->where('t.assignee = :user')
            ->andWhere('t.status != :done')
            ->setParameter('user', $user)
            ->setParameter('done', Task::STATUS_DONE)
            ->orderBy('t.dueDate', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Count tasks by status for a project
     */
    public function countByStatus(Project $project): array
    {
        $rows = $this->createQueryBuilder('t')
            ->select('t.status, COUNT(t.id) AS cnt')
            ->where('t.project = :project')
            ->setParameter('project', $project)
            ->groupBy('t.status')
            ->getQuery()
            ->getResult();

        $counts = array_fill_keys(Task::VALID_STATUSES, 0);
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['cnt'];
        }
        return $counts;
    }
}
