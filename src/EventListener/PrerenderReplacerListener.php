<?php

namespace Stopsopa\SparkBundle\EventListener;

use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\DependencyInjection\ContainerInterface;

class PrerenderReplacerListener
{
    protected $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function onKernelResponse(FilterResponseEvent $event)
    {
        $request = $event->getRequest();

        if ($event->isMasterRequest() && ($this->container->getParameter('kernel.environment') === 'dev' || $request->cookies->has('debug'))) {

            $response = $event->getResponse();

            $response->headers->set('X-z.route', '"' . $request->get('_route') . '"' );

            $response->headers->set('X-z.controller', '"' . $request->get('_controller') . '"' );
        }
    }
}