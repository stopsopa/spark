<?php

namespace Stopsopa\SparkBundle\Services;

/**
 * @package Stopsopa\SparkBundle\Services\SparkStorageInterface
 */
interface SparkStorageInterface {
    public function has($url);
    public function set($url, $html, $extradata = null);
    public function remove($url);
    public function getStatus($url);
}