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

                // for some reason in sf3 for homepage getUri() return wrong link
                //$entity = $service->has($request->getUri());              

                $entity = $service->has($_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']);

                if ($entity) {

                    if ($entity['status'] == 200) {

                        $entity['html'] = str_replace('</body>', '<div style="position:fixed;left:3px;bottom:1px;background-color:green;height:2px;width:2px;z-index:10000;"></div></body>', $entity['html']);

                        $response = new Response($entity['html']);

                        $response->headers->set(SparkService::XHEADER, 'hash-' . $entity['id']);

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
