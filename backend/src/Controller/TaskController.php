<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api')]
#[OA\Tag(name: 'Tasks')]
class TaskController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ProjectRepository      $projectRepository,
        private readonly TaskRepository         $taskRepository,
        private readonly ValidatorInterface     $validator,
    ) {}

    /**
     * List tasks for a project (with filters and pagination).
     */
    #[Route('/projects/{projectId}/tasks', name: 'task_index', methods: ['GET'], requirements: ['projectId' => '\d+'])]
    #[OA\Get(path: '/api/projects/{projectId}/tasks', summary: 'List tasks for a project', security: [['Bearer' => []]])]
    public function index(int $projectId, Request $request): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->getAccessibleProject($projectId, $user);
        if ($project instanceof JsonResponse) return $project;

        $page  = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, max(1, (int) $request->query->get('limit', 50)));

        $result = $this->taskRepository->findByProjectWithFilters(
            $project,
            $page,
            $limit,
            $request->query->get('status'),
            $request->query->get('priority'),
            $request->query->getInt('assigneeId') ?: null,
            $request->query->get('search'),
            $request->query->get('sort', 'position'),
            strtoupper($request->query->get('order', 'ASC'))
        );

        return $this->json([
            'data' => array_map(fn($t) => $this->serializeTask($t), $result['tasks']),
            'pagination' => [
                'total' => $result['total'],
                'page'  => $page,
                'limit' => $limit,
                'pages' => (int) ceil($result['total'] / $limit),
            ],
        ]);
    }

    /**
     * Get all tasks for a project grouped by status (Kanban view).
     */
    #[Route('/projects/{projectId}/tasks/kanban', name: 'task_kanban', methods: ['GET'], requirements: ['projectId' => '\d+'])]
    #[OA\Get(path: '/api/projects/{projectId}/tasks/kanban', summary: 'Get Kanban board data', security: [['Bearer' => []]])]
    public function kanban(int $projectId): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->getAccessibleProject($projectId, $user);
        if ($project instanceof JsonResponse) return $project;

        $grouped = $this->taskRepository->findKanbanByProject($project);

        $result = [];
        foreach ($grouped as $status => $tasks) {
            $result[$status] = array_map(fn($t) => $this->serializeTask($t), $tasks);
        }

        return $this->json($result);
    }

    /**
     * Create a new task inside a project.
     */
    #[Route('/projects/{projectId}/tasks', name: 'task_create', methods: ['POST'], requirements: ['projectId' => '\d+'])]
    #[OA\Post(path: '/api/projects/{projectId}/tasks', summary: 'Create a task', security: [['Bearer' => []]])]
    public function create(int $projectId, Request $request): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->getAccessibleProject($projectId, $user);
        if ($project instanceof JsonResponse) return $project;

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        $status = $data['status'] ?? Task::STATUS_TODO;

        $task = new Task();
        $task->setTitle(trim($data['title'] ?? ''));
        $task->setDescription(isset($data['description']) ? trim($data['description']) : null);
        $task->setStatus($status);
        $task->setPriority($data['priority'] ?? Task::PRIORITY_MEDIUM);
        $task->setProject($project);
        $task->setCreator($user);
        $task->setPosition($this->taskRepository->getNextPosition($project, $status));

        if (!empty($data['dueDate'])) {
            try {
                $task->setDueDate(new \DateTimeImmutable($data['dueDate']));
            } catch (\Exception) {
                return $this->json(['message' => 'Invalid dueDate format.'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (!empty($data['estimatedHours'])) {
            $task->setEstimatedHours((string) $data['estimatedHours']);
        }

        if (!empty($data['assigneeId'])) {
            $assignee = $this->em->getRepository(User::class)->find($data['assigneeId']);
            if ($assignee && $project->isMember($assignee)) {
                $task->setAssignee($assignee);
            } else {
                return $this->json(['message' => 'Assignee must be a member of the project.'], Response::HTTP_BAD_REQUEST);
            }
        }

        $errors = $this->validator->validate($task);
        if (count($errors) > 0) {
            return $this->json(['message' => 'Validation failed.', 'errors' => $this->formatErrors($errors)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($task);
        $this->em->flush();

        return $this->json($this->serializeTask($task), Response::HTTP_CREATED);
    }

    /**
     * Get a single task.
     */
    #[Route('/tasks/{id}', name: 'task_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[OA\Get(path: '/api/tasks/{id}', summary: 'Get task details', security: [['Bearer' => []]])]
    public function show(int $id): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json(['message' => 'Task not found.'], Response::HTTP_NOT_FOUND);
        }
        if (!$task->getProject()->isMember($user)) {
            return $this->json(['message' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($this->serializeTask($task));
    }

    /**
     * Update a task fully.
     */
    #[Route('/tasks/{id}', name: 'task_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[OA\Put(path: '/api/tasks/{id}', summary: 'Update a task', security: [['Bearer' => []]])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json(['message' => 'Task not found.'], Response::HTTP_NOT_FOUND);
        }

        $project = $task->getProject();
        if (!$project->isMember($user)) {
            return $this->json(['message' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['title']))       $task->setTitle(trim($data['title']));
        if (isset($data['description'])) $task->setDescription(trim($data['description']) ?: null);
        if (isset($data['status']))      $task->setStatus($data['status']);
        if (isset($data['priority']))    $task->setPriority($data['priority']);
        if (isset($data['position']))    $task->setPosition((int) $data['position']);
        if (isset($data['estimatedHours'])) $task->setEstimatedHours($data['estimatedHours'] ? (string) $data['estimatedHours'] : null);

        if (array_key_exists('dueDate', $data)) {
            if ($data['dueDate']) {
                try {
                    $task->setDueDate(new \DateTimeImmutable($data['dueDate']));
                } catch (\Exception) {
                    return $this->json(['message' => 'Invalid dueDate format.'], Response::HTTP_BAD_REQUEST);
                }
            } else {
                $task->setDueDate(null);
            }
        }

        if (array_key_exists('assigneeId', $data)) {
            if ($data['assigneeId']) {
                $assignee = $this->em->getRepository(User::class)->find($data['assigneeId']);
                if (!$assignee || !$project->isMember($assignee)) {
                    return $this->json(['message' => 'Assignee must be a member of the project.'], Response::HTTP_BAD_REQUEST);
                }
                $task->setAssignee($assignee);
            } else {
                $task->setAssignee(null);
            }
        }

        $errors = $this->validator->validate($task);
        if (count($errors) > 0) {
            return $this->json(['message' => 'Validation failed.', 'errors' => $this->formatErrors($errors)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();
        return $this->json($this->serializeTask($task));
    }

    /**
     * Update only the status of a task (for Kanban drag-and-drop).
     */
    #[Route('/tasks/{id}/status', name: 'task_update_status', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    #[OA\Patch(path: '/api/tasks/{id}/status', summary: 'Move a task to a new status', security: [['Bearer' => []]])]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json(['message' => 'Task not found.'], Response::HTTP_NOT_FOUND);
        }
        if (!$task->getProject()->isMember($user)) {
            return $this->json(['message' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        $data   = json_decode($request->getContent(), true);
        $status = $data['status'] ?? null;

        if (!$status || !in_array($status, Task::VALID_STATUSES, true)) {
            return $this->json(['message' => 'Invalid status. Allowed: ' . implode(', ', Task::VALID_STATUSES)], Response::HTTP_BAD_REQUEST);
        }

        $task->setStatus($status);
        if (isset($data['position'])) {
            $task->setPosition((int) $data['position']);
        } else {
            $task->setPosition($this->taskRepository->getNextPosition($task->getProject(), $status));
        }

        $this->em->flush();
        return $this->json($this->serializeTask($task));
    }

    /**
     * Delete a task.
     */
    #[Route('/tasks/{id}', name: 'task_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[OA\Delete(path: '/api/tasks/{id}', summary: 'Delete a task', security: [['Bearer' => []]])]
    public function delete(int $id): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json(['message' => 'Task not found.'], Response::HTTP_NOT_FOUND);
        }

        $project = $task->getProject();
        if (!$project->isMember($user)) {
            return $this->json(['message' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        // Only creator or project owner can delete
        if ($task->getCreator() !== $user && $project->getOwner() !== $user) {
            return $this->json(['message' => 'Only the task creator or project owner can delete this task.'], Response::HTTP_FORBIDDEN);
        }

        $this->em->remove($task);
        $this->em->flush();

        return $this->json(['message' => 'Task deleted successfully.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function getAccessibleProject(int $id, User $user): Project|JsonResponse
    {
        $project = $this->projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Project not found.'], Response::HTTP_NOT_FOUND);
        }
        if (!$project->isMember($user)) {
            return $this->json(['message' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }
        return $project;
    }

    private function serializeTask(Task $task): array
    {
        return [
            'id'             => $task->getId(),
            'title'          => $task->getTitle(),
            'description'    => $task->getDescription(),
            'status'         => $task->getStatus(),
            'priority'       => $task->getPriority(),
            'position'       => $task->getPosition(),
            'dueDate'        => $task->getDueDate()?->format('Y-m-d'),
            'estimatedHours' => $task->getEstimatedHours(),
            'isOverdue'      => $task->isOverdue(),
            'createdAt'      => $task->getCreatedAt()?->format('c'),
            'updatedAt'      => $task->getUpdatedAt()?->format('c'),
            'projectId'      => $task->getProject()->getId(),
            'assignee'       => $task->getAssignee() ? [
                'id'       => $task->getAssignee()->getId(),
                'fullName' => $task->getAssignee()->getFullName(),
                'initials' => $task->getAssignee()->getInitials(),
                'avatar'   => $task->getAssignee()->getAvatar(),
            ] : null,
            'creator' => $task->getCreator() ? [
                'id'       => $task->getCreator()->getId(),
                'fullName' => $task->getCreator()->getFullName(),
                'initials' => $task->getCreator()->getInitials(),
            ] : null,
        ];
    }

    private function formatErrors(\Symfony\Component\Validator\ConstraintViolationListInterface $errors): array
    {
        $messages = [];
        foreach ($errors as $violation) {
            $messages[$violation->getPropertyPath()] = $violation->getMessage();
        }
        return $messages;
    }
}
