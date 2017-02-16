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

            if (is_array($list)) {
                
                $response = $event->getResponse();

                $ct = $response->headers->get('content-type');

                file_put_contents(App::getRootDir() . '/app/cache/log.log', json_encode($ct, JSON_PRETTY_PRINT), FILE_APPEND);

                if (!$ct || ($ct && strpos($ct, 'text/html') !== false)) {

                    $content = $response->getContent();

                    $content = str_replace('</body>', '<div style="position:fixed;left:3px;bottom:1px;background-color:red;height:2px;width:2px;z-index:10000;"></div></body>', $content);

                    $response->setContent($content);
                }

                foreach ($list as $name => $value) {
                    $response->headers->set($name, $value);
                }
            }
        }
    }
}
