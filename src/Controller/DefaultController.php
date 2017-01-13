<?php

namespace Stopsopa\SparkBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction($name)
    {
        return $this->render('StopsopaSparkBundle:Default:index.html.twig', array('name' => $name));
    }
}
