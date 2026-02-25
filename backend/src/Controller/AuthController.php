<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
#[OA\Tag(name: 'Authentication')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface          $validator,
        private readonly JWTTokenManagerInterface    $jwtManager,
    ) {}

    /**
     * Register a new user account.
     */
    #[Route('/register', name: 'auth_register', methods: ['POST'])]
    #[OA\Post(
        path: '/api/auth/register',
        summary: 'Register a new user',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: [
                    new OA\Property(property: 'email',     type: 'string', format: 'email', example: 'jane@example.com'),
                    new OA\Property(property: 'password',  type: 'string', minLength: 8,   example: 'SecurePass1!'),
                    new OA\Property(property: 'firstName', type: 'string', example: 'Jane'),
                    new OA\Property(property: 'lastName',  type: 'string', example: 'Doe'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'User created – returns JWT token'),
            new OA\Response(response: 409, description: 'Email already in use'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        // Check email uniqueness early
        $existingUser = $this->em->getRepository(User::class)->findOneBy(['email' => strtolower(trim($data['email'] ?? ''))]);
        if ($existingUser) {
            return $this->json(
                ['message' => 'Email already in use.', 'errors' => ['email' => 'This email address is already registered.']],
                Response::HTTP_CONFLICT
            );
        }

        $user = new User();
        $user->setEmail(strtolower(trim($data['email'] ?? '')));
        $user->setFirstName(trim($data['firstName'] ?? ''));
        $user->setLastName(trim($data['lastName'] ?? ''));
        $user->setPlainPassword($data['password'] ?? '');

        $errors = $this->validator->validate($user, null, ['Default', 'create']);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $violation) {
                $errorMessages[$violation->getPropertyPath()] = $violation->getMessage();
            }
            return $this->json(['message' => 'Validation failed.', 'errors' => $errorMessages], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $user->getPlainPassword()));
        $user->eraseCredentials();

        $this->em->persist($user);
        $this->em->flush();

        $token = $this->jwtManager->create($user);

        return $this->json([
            'message' => 'Account created successfully.',
            'token'   => $token,
            'user'    => $this->serializeUser($user),
        ], Response::HTTP_CREATED);
    }

    /**
     * Login endpoint is handled by Lexik JWT (see security.yaml).
     * This annotation documents it in Swagger.
     */
    #[Route('/login', name: 'auth_login', methods: ['POST'])]
    #[OA\Post(
        path: '/api/auth/login',
        summary: 'Authenticate and get a JWT token',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email',    type: 'string', format: 'email', example: 'jane@example.com'),
                    new OA\Property(property: 'password', type: 'string', example: 'SecurePass1!'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Returns JWT token'),
            new OA\Response(response: 401, description: 'Invalid credentials'),
        ]
    )]
    public function login(): never
    {
        // This route is intercepted by the Lexik JWT firewall.
        throw new \LogicException('This route is handled by the JWT firewall.');
    }

    /**
     * Get the authenticated user's profile.
     */
    #[Route('/me', name: 'auth_me', methods: ['GET'])]
    #[OA\Get(
        path: '/api/auth/me',
        summary: 'Get current authenticated user',
        security: [['Bearer' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Current user profile'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->json(['user' => $this->serializeUser($user)]);
    }

    private function serializeUser(User $user): array
    {
        return [
            'id'        => $user->getId(),
            'email'     => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'fullName'  => $user->getFullName(),
            'initials'  => $user->getInitials(),
            'avatar'    => $user->getAvatar(),
            'bio'       => $user->getBio(),
            'roles'     => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()?->format('c'),
            'updatedAt' => $user->getUpdatedAt()?->format('c'),
        ];
    }
}
