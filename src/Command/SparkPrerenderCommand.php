<?php

namespace Stopsopa\SparkBundle\Command;

use Stopsopa\SparkBundle\Services\SparkService;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputOption;
use Stopsopa\SparkBundle\Services\SparkServiceException;

class SparkPrerenderCommand extends ContainerAwareCommand
{
    public function configure()
    {
        $this
            ->setName('stopsopa:prerender')
            ->setDescription('Prerender entire list of pages')
            ->addOption('perpage', null, InputOption::VALUE_OPTIONAL, 'Chunk size', 100)
            ->addOption('skipgood', null, InputOption::VALUE_OPTIONAL, "Prerender only not status 200", false)
        ;
    }

    public function execute(InputInterface $input, OutputInterface $output)
    {
        /* @var $service SparkService */
        $service = $this->getContainer()->get(SparkService::SERVICE);

        $perPage = intval($input->getOption('perpage'));

        $service->reset();

        $skipgood = ! ($input->getOption('skipgood') === false);

        do {

            $list = $service->getChunk($perPage);

            foreach ($list as $url) {

                if ($skipgood) {

                    $status = $service->getStatus($url);

                    if ($status === 200) {

                        $output->writeln("(skipping because of status $status): $url");

                        continue;
                    }
                }

                $output->writeln("Rendering: $url");

                try {
                    $service->prerender($url);
                }
                catch (SparkServiceException $e) {
                    $output->writeln("<error>".$e->getMessage()."</error>");
                }
            }

        } while (count($list));

        $output->writeln("All done ...");
    }
}
