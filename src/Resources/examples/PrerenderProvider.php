<?php

namespace Cms\CoreBundle\Service;

use Cms\CoreBundle\Command\SitemapXmlCommand;
use Cms\CoreBundle\Libs\App;
use Stopsopa\SparkBundle\Services\SparkProviderInterface;
use Doctrine\ODM\PHPCR\Query\Builder\QueryBuilder;
use Cms\CoreBundle\Document\Route;

/**
 * @package Cms\CoreBundle\Service\PrerenderProvider
 */
class PrerenderProvider implements SparkProviderInterface {

    protected $offset = 0;
    protected $origin;
    protected $router;
    protected $em;

    public function __construct()
    {
        $this->origin = SitemapXmlCommand::$host[App::getParam('site')];
        $this->router = App::get('router');
        $this->em     = App::getODMManager();
    }

    public function getChunk($perPage = 100)
    {
        $list = array();

        $site = App::getParam('site');

        $queryBuilderDoc = $this->em->createQueryBuilder();

        /* @var $queryBuilderDoc QueryBuilder */

        $queryBuilderDoc->fromDocument('Cms\CoreBundle\Document\Route', 'p');
        $queryBuilderDoc->setFirstResult($this->offset);
        $queryBuilderDoc->setMaxResults($perPage);
        $queryBuilderDoc
            ->where()
            ->andX()
            ->fieldIsset('p.content')
            ->descendant('/cms/' . $site . '/routes', 'p')
        ;

        $routes = $queryBuilderDoc->getQuery()->getResult();

        foreach ($routes as $route) {

            /* @var $route Route */

            if (!$route->getPublished()) {

                continue;
            }

            $list[] =  $this->origin . $this->router->generate($route->getId());
        }

        return $list;
    }

    public function reset()
    {
        $this->offset = 0;

        return $this;
    }
}