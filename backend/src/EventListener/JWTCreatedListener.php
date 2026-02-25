<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;

/**
 * Enriches the JWT payload with extra user data.
 */
class JWTCreatedListener
{
    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        /** @var User $user */
        $user    = $event->getUser();
        $payload = $event->getData();

        $payload['id']        = $user->getId();
        $payload['firstName'] = $user->getFirstName();
        $payload['lastName']  = $user->getLastName();
        $payload['fullName']  = $user->getFullName();
        $payload['initials']  = $user->getInitials();
        $payload['avatar']    = $user->getAvatar();
        $payload['roles']     = $user->getRoles();

        $event->setData($payload);
    }
}
