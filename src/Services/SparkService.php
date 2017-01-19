<?php

namespace Stopsopa\SparkBundle\Services;

use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * @package Stopsopa\SparkBundle\Services\SparkMysqlService
 */
class SparkService implements SparkStorageInterface, SparkProviderInterface {

    const SERVICE = 'spark.cache.service';
    const XHEADER = 'X-prerendered';
    /**
     * @var SparkStorageInterface
     */
    protected $storage;

    /**
     * @var SparkProviderInterface
     */
    protected $provider;

    /**
     * @var ContainerInterface
     */
    protected $container;

    protected $endpoint;

    protected $headersToPass;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;

        if (!$this->container->hasParameter('spark.cache.service.endpoint')) {
            throw new SparkServiceException("Parameter 'spark.cache.service.endpoint' don't exist");
        }

        $this->endpoint = $this->container->getParameter('spark.cache.service.endpoint');
    }
    /**
     * @return SparkStorageInterface
     * @throws SparkServiceException
     */
    protected function getStorage()
    {

        if (!$this->storage) {

            $name = $this->container->getParameter('spark.cache.storage');

            if ($name) {

                $this->storage = $this->container->get($name);

                if (!$this->storage instanceof SparkStorageInterface) {

                    $class = get_class($this->storage);

                    throw new SparkServiceException("Class '$class' don't implement interface SparkStorageInterface");
                }

                return $this->storage;
            }

            throw new SparkServiceException("Service '$name' not found");
        }

        return $this->storage;
    }
    /**
     * @return SparkProviderInterface
     * @throws SparkServiceException
     */
    protected function getProvider()
    {

        if (!$this->provider) {

            $name = $this->container->getParameter('spark.urls.provider');

            if ($name) {

                $this->provider = $this->container->get($name);

                if (!$this->provider instanceof SparkProviderInterface) {

                    $class = get_class($this->provider);

                    throw new SparkServiceException("Class '$class' don't implement interface SparkProviderInterface");
                }

                return $this->provider;
            }

            throw new SparkServiceException("Service '$name' not found");
        }

        return $this->provider;
    }
    public function has($url)
    {
        return $this->getStorage()->has($url);
    }
    public function set($url, $html, $extradata = null)
    {
        return $this->getStorage()->set($url, $html, $extradata);
    }
    public function remove($url)
    {
        return $this->getStorage()->remove($url);
    }
    public function getStatus($url)
    {
        return $this->getStorage()->getStatus($url);
    }
    public function reset()
    {
        return $this->getProvider()->reset();
    }
    public function getChunk($perPage = 100)
    {
        return $this->getProvider()->getChunk($perPage);
    }
    public function check($url) {

        $data = $this->fetch($url);

        if (!array_key_exists('headers', $data)) {
            throw new SparkServiceException("Didn't found headers");
        }

        $tmp = array();
        foreach ($data['headers'] as $key => $value) {
            $tmp[strtolower($key)] = $value;
        }

        $data['headers'] = $tmp;

        $lheader = strtolower(static::XHEADER);

        if (array_key_exists($lheader, $data['headers'])) {

            $xheader = $data['headers'][$lheader];

            if (strpos($xheader, 'hash-') === 0) {

                return $xheader;
            }

            throw new SparkServiceException($xheader);
        }

        throw new SparkServiceException("Header " . static::XHEADER. " not found");
    }
    protected function fetch($url) {

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT , 10);

        curl_setopt($ch, CURLOPT_ENCODING, '');

//        curl_setopt($ch, CURLOPT_USERPWD, $this->user.':'.$this->password);

        curl_setopt($ch, CURLOPT_URL, $url);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

//        curl_setopt($ch, CURLOPT_VERBOSE, true); // good for debugging

        curl_setopt($ch, CURLOPT_HEADER, 1);

        $response = null;

        $response = curl_exec($ch);

        // Then, after your curl_exec call:
        $header_size    = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

        $header         = substr($response, 0, $header_size);

        $data = array();

        $data['status'] = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($data['status'] === 0) {
            throw new SparkServiceException("Unable to connect to $url");
        }

        curl_close($ch);

        $header = explode("\n", $header);

        $hlist = array();
        foreach ($header as &$d) {

            $dd = explode(':', $d, 2);

            if (count($dd) === 2) {
                $hlist[$dd[0]] = trim($dd[1]);
            }
        }

        $data['headers'] = $hlist;

        return $data;

    }
    public function prerender($url)
    {
        $json = $this->api($url);

        if (!isset($json['body']['html'])) {

            $this->set($url, '', $json);

            throw new SparkServiceException("Wrong response data, 'body.html' field missing, couln't prerender");
        }

        return $this->set($url, $json['body']['html'], $json);
    }
    /**
     * @throws Exception
     * http://httpd.pl/bundles/toolssitecommon/tools/transform.php
     */
    protected function api($url)
    {
        $method = 'POST';

        $data = array(
            'url' => $url
        );

        $headers = array();

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT , 10);

        curl_setopt($ch, CURLOPT_ENCODING, '');

//        curl_setopt($ch, CURLOPT_USERPWD, $this->user.':'.$this->password);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        curl_setopt($ch, CURLOPT_URL, $this->endpoint);

        if (!is_string($data) && $data) {
            $data = json_encode($data);
        }

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }

        $headers = array_merge($headers, array(
            'Content-Type: application/json; charset=utf-8',
        ));

        if (count($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

//        curl_setopt($ch, CURLOPT_VERBOSE, true); // good for debugging

        curl_setopt($ch, CURLOPT_HEADER, 1);

        $response = null;

        $response = curl_exec($ch);

        // Then, after your curl_exec call:
        $header_size    = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

        $header         = substr($response, 0, $header_size);

        $body           = substr($response, $header_size);

        $data = array();

        $data['body']   = json_decode($body, true) ?: $body;

        $data['status'] = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($data['status'] === 0) {
            throw new SparkServiceException("Unable to connect to spark prerender {$this->endpoint} specified in parameter 'spark.cache.service.endpoint'");
        }

        curl_close($ch);

        $header = explode("\n", $header);

        $hlist = array();
        foreach ($header as &$d) {

            $dd = explode(':', $d, 2);

            if (count($dd) === 2) {
                $hlist[$dd[0]] = trim($dd[1]);
            }
        }

        $data['headers'] = $hlist;

        return $data;
    }

    /**
     * @return mixed
     */
    public function getHeadersToPass()
    {
        return $this->headersToPass;
    }

    /**
     * @param mixed $headersToPass
     * @return SparkService
     */
    public function setHeadersToPass($headersToPass)
    {
        $this->headersToPass = $headersToPass;
        return $this;
    }

}
