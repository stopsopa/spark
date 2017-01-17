<?php

namespace Stopsopa\SparkBundle\EventListener;

use Cms\CoreBundle\Libs\App;
use Doctrine\DBAL\Connection;
use Stopsopa\SparkBundle\Services\SparkService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;

/**
 * @package Stopsopa\SparkBundle\EventListener\PrerenderReplacerListener
 */
class PrerenderReplacerListener
{
    protected $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function onKernelResponse(GetResponseEvent $event)
    {
        $request = $event->getRequest();

        if ($event->isMasterRequest() && !$request->cookies->has('debug')) {

            $service = $this->container->get(SparkService::SERVICE);

            if ($this->container->getParameter('kernel.environment') === 'prod') {

                $entity = $service->has($request->getUri());

                if ($entity) {

                    if ($entity['status'] == 200) {

                        $response = new Response($entity['html']);

                        $response->headers->set(SparkService::XHEADER, $entity['id']);

                        $event->setResponse($response);
                    }
                    else {
                        $service->setHeadersToPass(array(
                            SparkService::XHEADER => 'status-' . $entity['status']
                        ));
                    }
                }
                else {
                    $service->setHeadersToPass(array(
                        SparkService::XHEADER => 'notfound'
                    ));
                }
            }
            else {
                $service->setHeadersToPass(array(
                    SparkService::XHEADER => 'devmode'
                ));
            }
        }
    }
}