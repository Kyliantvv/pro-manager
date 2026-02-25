<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/users')]
#[OA\Tag(name: 'Users')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly UserRepository              $userRepository,
        private readonly ValidatorInterface          $validator,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    /**
     * Get the current user's profile.
     */
    #[Route('/me', name: 'user_me', methods: ['GET'])]
    #[OA\Get(path: '/api/users/me', summary: 'Get own profile', security: [['Bearer' => []]])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        return $this->json(['user' => $this->serializeUser($user)]);
    }

    /**
     * Update the current user's profile.
     */
    #[Route('/me', name: 'user_update_me', methods: ['PUT'])]
    #[OA\Put(path: '/api/users/me', summary: 'Update own profile', security: [['Bearer' => []]])]
    public function updateMe(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['firstName'])) $user->setFirstName(trim($data['firstName']));
        if (isset($data['lastName']))  $user->setLastName(trim($data['lastName']));
        if (isset($data['bio']))       $user->setBio(trim($data['bio']) ?: null);
        if (isset($data['avatar']))    $user->setAvatar($data['avatar'] ?: null);

        // Password change (optional)
        if (!empty($data['newPassword'])) {
            if (empty($data['currentPassword'])) {
                return $this->json(['message' => 'Current password is required to set a new one.'], Response::HTTP_BAD_REQUEST);
            }
            if (!$this->passwordHasher->isPasswordValid($user, $data['currentPassword'])) {
                return $this->json(['message' => 'Current password is incorrect.', 'errors' => ['currentPassword' => 'Incorrect password.']], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $user->setPlainPassword($data['newPassword']);
        }

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $v) {
                $messages[$v->getPropertyPath()] = $v->getMessage();
            }
            return $this->json(['message' => 'Validation failed.', 'errors' => $messages], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($user->getPlainPassword()) {
            $user->setPassword($this->passwordHasher->hashPassword($user, $user->getPlainPassword()));
            $user->eraseCredentials();
        }

        $this->em->flush();

        return $this->json(['message' => 'Profile updated successfully.', 'user' => $this->serializeUser($user)]);
    }

    /**
     * Search users by name or email (for adding members).
     */
    #[Route('/search', name: 'user_search', methods: ['GET'])]
    #[OA\Get(
        path: '/api/users/search',
        summary: 'Search users by name or email',
        security: [['Bearer' => []]],
        parameters: [
            new OA\Parameter(name: 'q',     in: 'query', required: true,  schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ]
    )]
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->query->get('q', ''));
        $limit = min(20, max(1, (int) $request->query->get('limit', 10)));

        if (strlen($query) < 2) {
            return $this->json(['message' => 'Search query must be at least 2 characters.'], Response::HTTP_BAD_REQUEST);
        }

        $users = $this->userRepository->searchUsers($query, $limit);

        return $this->json([
            'data' => array_map(fn(User $u) => [
                'id'       => $u->getId(),
                'email'    => $u->getEmail(),
                'fullName' => $u->getFullName(),
                'initials' => $u->getInitials(),
                'avatar'   => $u->getAvatar(),
            ], $users),
        ]);
    }

    private function serializeUser(User $user): array
    {
        return [
            'id'             => $user->getId(),
            'email'          => $user->getEmail(),
            'firstName'      => $user->getFirstName(),
            'lastName'       => $user->getLastName(),
            'fullName'       => $user->getFullName(),
            'initials'       => $user->getInitials(),
            'avatar'         => $user->getAvatar(),
            'bio'            => $user->getBio(),
            'roles'          => $user->getRoles(),
            'projectsOwned'  => $user->getOwnedProjects()->count(),
            'projectsMember' => $user->getMemberProjects()->count(),
            'createdAt'      => $user->getCreatedAt()?->format('c'),
            'updatedAt'      => $user->getUpdatedAt()?->format('c'),
        ];
    }
}
