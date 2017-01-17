<?php

namespace Stopsopa\SparkBundle\EventListener;

use Doctrine\DBAL\Connection;
use Stopsopa\SparkBundle\Services\SparkService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Cms\CoreBundle\Libs\App;

/**
 * @package Stopsopa\SparkBundle\EventListener\PrerenderReplacerAfterListener
 */
class PrerenderReplacerAfterListener
{
    protected $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function onKernelResponse(FilterResponseEvent $event)
    {
        $request = $event->getRequest();

        if ($event->isMasterRequest() && !$request->cookies->has('debug')) {

            $service = $this->container->get(SparkService::SERVICE);

            $list = $service->getHeadersToPass();

            $response = $event->getResponse();

            foreach ($list as $name => $value) {
                $response->headers->set($name, $value);
            }
        }
    }
}