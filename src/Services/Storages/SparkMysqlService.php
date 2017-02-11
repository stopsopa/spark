<?php

namespace Stopsopa\SparkBundle\Services\Storages;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityRepository;
use Stopsopa\SparkBundle\Entity\SparkCache;
use Stopsopa\SparkBundle\Services\SparkStorageInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Stopsopa\SparkBundle\Services\SparkServiceException;

/**
 * @package Stopsopa\SparkBundle\Services\Storages\SparkMysqlService
 */
class SparkMysqlService implements SparkStorageInterface {

    const SERVICE = 'spark.cache.mysql.storage';
    /**
     * @var ContainerInterface
     */
    protected $container;
    /**
     * @var EntityRepository
     */
    protected $er;

    /**
     * @var Connection
     */
    protected $dbal;

    /**
     * @var EntityManager
     */
    protected $em;
    protected $tablename;
    public function __construct(ContainerInterface $container, $em, $entity)
    {
        $this->em           = $container->get($em);
        $this->er           = $this->em->getRepository($entity);
        $this->dbal         = $this->em->getConnection();
        $this->tablename    = $this->em->getClassMetadata($entity)->getTableName();
    }
    protected function hash($url) {

        if (!$url) {
            throw new SparkServiceException("Url not specified");
        }

        preg_match('#^https?://(?:[^/]+)(.*)$#', $url, $match);

        if (count($match) === 2) {
            $url = $match[1];
        }

        return sha1($url);
    }

    /**
     * @param $url
     * @return array|null
     */
    public function has($url) {

        $id = $this->hash($url);

        $exist = $this->dbal->fetchAssoc("SELECT id, statusCode status, html FROM {$this->tablename} WHERE id = :id", array(
            'id' => $id
        ));

        if ($exist) {

            return $exist;
        }

        return false;
    }
    public function getStatus($url)
    {
        $id = $this->hash($url);

        $exist = $this->dbal->fetchAssoc("SELECT statusCode FROM {$this->tablename} WHERE id = :id", array(
            'id' => $id
        ));

        if ($exist) {

            return intval($exist['statusCode']);
        }

        return false;
    }

    public function set($url, $html, $extradata = null) {

        $id = $this->hash($url);

        $exist = $this->dbal->fetchAssoc("SELECT id FROM {$this->tablename} WHERE id = :id", array(
            'id' => $id
        ));

        if (!isset($extradata['body'])) {
            throw new SparkServiceException("Wrong response data, 'body' field missing");
        }

        unset($extradata['body']['html']);

        $data = array(
            'html' => $html,
            'updated' => date('Y-m-d H:i:s'),
            'statusCode' => isset($extradata['status']) ? $extradata['status'] : null,
            'json' => json_encode($extradata['body'], JSON_PRETTY_PRINT)
        );

        if ($exist) {
            $this->dbal->update($this->tablename, $data, array(
                'id' => $id
            ));
        }
        else {
            $data['id'] = $id;
            $data['url'] = $url;

            $this->dbal->insert($this->tablename, $data);
        }

        return $this;
    }

    public function remove($url)
    {
        $id = $this->hash($url);

        /* @var $entity SparkCache */
        $entity = $this->er->find($id);

        if ($entity) {
            $this->em->remove($entity);
            $this->em->flush();
        }

        return $this;
    }
}