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

#[Route('/api/projects')]
#[OA\Tag(name: 'Projects')]
class ProjectController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ProjectRepository      $projectRepository,
        private readonly TaskRepository         $taskRepository,
        private readonly ValidatorInterface     $validator,
    ) {}

    /**
     * List all projects accessible to the authenticated user (with pagination & filters).
     */
    #[Route('', name: 'project_index', methods: ['GET'])]
    #[OA\Get(
        path: '/api/projects',
        summary: 'List user projects with pagination and filters',
        security: [['Bearer' => []]],
        parameters: [
            new OA\Parameter(name: 'page',     in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'limit',    in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'status',   in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'priority', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search',   in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort',     in: 'query', required: false, schema: new OA\Schema(type: 'string', default: 'createdAt')),
            new OA\Parameter(name: 'order',    in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['ASC', 'DESC'])),
        ],
        responses: [new OA\Response(response: 200, description: 'Paginated list of projects')]
    )]
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user  = $this->getUser();
        $page  = max(1, (int) $request->query->get('page', 1));
        $limit = min(50, max(1, (int) $request->query->get('limit', 10)));

        $result = $this->projectRepository->findByUserWithFilters(
            $user,
            $page,
            $limit,
            $request->query->get('status'),
            $request->query->get('priority'),
            $request->query->get('search'),
            $request->query->get('sort', 'createdAt'),
            strtoupper($request->query->get('order', 'DESC'))
        );

        return $this->json([
            'data' => array_map(fn($p) => $this->serializeProject($p), $result['projects']),
            'pagination' => [
                'total' => $result['total'],
                'page'  => $page,
                'limit' => $limit,
                'pages' => (int) ceil($result['total'] / $limit),
            ],
        ]);
    }

    /**
     * Create a new project.
     */
    #[Route('', name: 'project_create', methods: ['POST'])]
    #[OA\Post(path: '/api/projects', summary: 'Create a new project', security: [['Bearer' => []]])]
    public function create(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        $project = new Project();
        $project->setName(trim($data['name'] ?? ''));
        $project->setDescription($data['description'] ? trim($data['description']) : null);
        $project->setStatus($data['status'] ?? Project::STATUS_PLANNING);
        $project->setPriority($data['priority'] ?? Project::PRIORITY_MEDIUM);
        $project->setColor($data['color'] ?? '#6366f1');
        $project->setOwner($user);

        if (!empty($data['dueDate'])) {
            try {
                $project->setDueDate(new \DateTimeImmutable($data['dueDate']));
            } catch (\Exception) {
                return $this->json(['message' => 'Invalid dueDate format. Use ISO 8601.'], Response::HTTP_BAD_REQUEST);
            }
        }

        $errors = $this->validator->validate($project);
        if (count($errors) > 0) {
            return $this->json(['message' => 'Validation failed.', 'errors' => $this->formatErrors($errors)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($project);
        $this->em->flush();

        return $this->json($this->serializeProject($project), Response::HTTP_CREATED);
    }

    /**
     * Get a single project by ID.
     */
    #[Route('/{id}', name: 'project_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[OA\Get(path: '/api/projects/{id}', summary: 'Get project details', security: [['Bearer' => []]])]
    public function show(int $id): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->find($id);

        if (!$project) {
            return $this->json(['message' => 'Project not found.'], Response::HTTP_NOT_FOUND);
        }
        if (!$project->isMember($user)) {
            return $this->json(['message' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($this->serializeProject($project, true));
    }

    /**
     * Update a project (owner only).
     */
    #[Route('/{id}', name: 'project_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[OA\Put(path: '/api/projects/{id}', summary: 'Update a project', security: [['Bearer' => []]])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->find($id);

        if (!$project) {
            return $this->json(['message' => 'Project not found.'], Response::HTTP_NOT_FOUND);
        }
        if ($project->getOwner() !== $user) {
            return $this->json(['message' => 'Only the project owner can update it.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['name']))        $project->setName(trim($data['name']));
        if (isset($data['description'])) $project->setDescription(trim($data['description']) ?: null);
        if (isset($data['status']))      $project->setStatus($data['status']);
        if (isset($data['priority']))    $project->setPriority($data['priority']);
        if (isset($data['color']))       $project->setColor($data['color']);

        if (array_key_exists('dueDate', $data)) {
            if ($data['dueDate']) {
                try {
                    $project->setDueDate(new \DateTimeImmutable($data['dueDate']));
                } catch (\Exception) {
                    return $this->json(['message' => 'Invalid dueDate format.'], Response::HTTP_BAD_REQUEST);
                }
            } else {
                $project->setDueDate(null);
            }
        }

        $errors = $this->validator->validate($project);
        if (count($errors) > 0) {
            return $this->json(['message' => 'Validation failed.', 'errors' => $this->formatErrors($errors)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();
        return $this->json($this->serializeProject($project));
    }

    /**
     * Delete a project (owner only).
     */
    #[Route('/{id}', name: 'project_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[OA\Delete(path: '/api/projects/{id}', summary: 'Delete a project', security: [['Bearer' => []]])]
    public function delete(int $id): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->find($id);

        if (!$project) {
            return $this->json(['message' => 'Project not found.'], Response::HTTP_NOT_FOUND);
        }
        if ($project->getOwner() !== $user) {
            return $this->json(['message' => 'Only the project owner can delete it.'], Response::HTTP_FORBIDDEN);
        }

        $this->em->remove($project);
        $this->em->flush();

        return $this->json(['message' => 'Project deleted successfully.']);
    }

    /**
     * Add a member to a project by email (owner only).
     */
    #[Route('/{id}/members', name: 'project_add_member', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[OA\Post(path: '/api/projects/{id}/members', summary: 'Add a member to a project', security: [['Bearer' => []]])]
    public function addMember(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->find($id);

        if (!$project) {
            return $this->json(['message' => 'Project not found.'], Response::HTTP_NOT_FOUND);
        }
        if ($project->getOwner() !== $user) {
            return $this->json(['message' => 'Only the project owner can manage members.'], Response::HTTP_FORBIDDEN);
        }

        $data  = json_decode($request->getContent(), true);
        $email = strtolower(trim($data['email'] ?? ''));

        if (!$email) {
            return $this->json(['message' => 'Email is required.'], Response::HTTP_BAD_REQUEST);
        }

        $member = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        if (!$member) {
            return $this->json(['message' => 'No user found with that email address.'], Response::HTTP_NOT_FOUND);
        }
        if ($member === $project->getOwner()) {
            return $this->json(['message' => 'The owner is already a member.'], Response::HTTP_CONFLICT);
        }
        if ($project->getMembers()->contains($member)) {
            return $this->json(['message' => 'User is already a member of this project.'], Response::HTTP_CONFLICT);
        }

        $project->addMember($member);
        $this->em->flush();

        return $this->json(['message' => 'Member added successfully.', 'project' => $this->serializeProject($project)]);
    }

    /**
     * Remove a member from a project (owner only).
     */
    #[Route('/{id}/members/{memberId}', name: 'project_remove_member', methods: ['DELETE'], requirements: ['id' => '\d+', 'memberId' => '\d+'])]
    #[OA\Delete(path: '/api/projects/{id}/members/{memberId}', summary: 'Remove a member from a project', security: [['Bearer' => []]])]
    public function removeMember(int $id, int $memberId): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->find($id);

        if (!$project) {
            return $this->json(['message' => 'Project not found.'], Response::HTTP_NOT_FOUND);
        }
        if ($project->getOwner() !== $user) {
            return $this->json(['message' => 'Only the project owner can manage members.'], Response::HTTP_FORBIDDEN);
        }

        $member = $this->em->getRepository(User::class)->find($memberId);
        if (!$member || !$project->getMembers()->contains($member)) {
            return $this->json(['message' => 'Member not found in this project.'], Response::HTTP_NOT_FOUND);
        }

        $project->removeMember($member);
        $this->em->flush();

        return $this->json(['message' => 'Member removed successfully.']);
    }

    // ─── Serialization ───────────────────────────────────────────────────────

    private function serializeProject(Project $project, bool $includeTasks = false): array
    {
        $tasks = $project->getTasks();
        $done  = $tasks->filter(fn(Task $t) => $t->getStatus() === Task::STATUS_DONE)->count();

        $data = [
            'id'          => $project->getId(),
            'name'        => $project->getName(),
            'description' => $project->getDescription(),
            'status'      => $project->getStatus(),
            'priority'    => $project->getPriority(),
            'color'       => $project->getColor(),
            'dueDate'     => $project->getDueDate()?->format('Y-m-d'),
            'createdAt'   => $project->getCreatedAt()?->format('c'),
            'updatedAt'   => $project->getUpdatedAt()?->format('c'),
            'completion'  => $project->getCompletionPercentage(),
            'owner'       => [
                'id'       => $project->getOwner()->getId(),
                'fullName' => $project->getOwner()->getFullName(),
                'email'    => $project->getOwner()->getEmail(),
                'initials' => $project->getOwner()->getInitials(),
                'avatar'   => $project->getOwner()->getAvatar(),
            ],
            'members' => $project->getMembers()->map(fn(User $m) => [
                'id'       => $m->getId(),
                'fullName' => $m->getFullName(),
                'email'    => $m->getEmail(),
                'initials' => $m->getInitials(),
                'avatar'   => $m->getAvatar(),
            ])->getValues(),
            'taskStats' => [
                'total'       => $tasks->count(),
                'todo'        => $tasks->filter(fn(Task $t) => $t->getStatus() === Task::STATUS_TODO)->count(),
                'in_progress' => $tasks->filter(fn(Task $t) => $t->getStatus() === Task::STATUS_IN_PROGRESS)->count(),
                'review'      => $tasks->filter(fn(Task $t) => $t->getStatus() === Task::STATUS_REVIEW)->count(),
                'done'        => $done,
            ],
        ];

        if ($includeTasks) {
            $data['tasks'] = $tasks->map(fn(Task $t) => $this->serializeTask($t))->getValues();
        }

        return $data;
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
            'assignee' => $task->getAssignee() ? [
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
