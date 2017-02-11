<?php

namespace Stopsopa\SparkBundle\Services;

/**
 * @package Stopsopa\SparkBundle\Services\SparkProviderInterface
 */
interface SparkProviderInterface {
    public function getChunk($perPage = 100);
    public function reset();
}