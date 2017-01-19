<?php

namespace Stopsopa\SparkBundle\Command;

use Stopsopa\SparkBundle\Services\SparkService;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputOption;
use Stopsopa\SparkBundle\Services\SparkServiceException;

class SparkCheckerCommand extends ContainerAwareCommand
{
    public function configure()
    {
        $this
            ->setName('stopsopa:prerender:check')
            ->setDescription('Prerender headers checker')
            ->addOption('perpage', null, InputOption::VALUE_OPTIONAL, 'Chunk size', 100)
            ->addOption('dryrun', null, InputOption::VALUE_OPTIONAL, "Don't prerender anything, just iterate through list", false)
            ->addOption('showall', null, InputOption::VALUE_OPTIONAL, "Show only pages with wrong header", false)
        ;
    }
    public function execute(InputInterface $input, OutputInterface $output)
    {
        /* @var $service SparkService */
        $service = $this->getContainer()->get(SparkService::SERVICE);

        $perPage = intval($input->getOption('perpage'));

        $dryrun = ! ($input->getOption('dryrun') === false);

        $showall = ! ($input->getOption('showall') === false);

        $service->reset();

        do {

            $list = $service->getChunk($perPage);

            $i = 1;

            foreach ($list as $url) {

                if ($dryrun) {
                    $output->writeln($url);
                }
                else {
                    try {
                        if ($showall) {

                            $output->writeln($url);

                            $output->writeln($service->check($url));
                        }
                        else {

                            $output->write("\rurl: $i");

                            $service->check($url);
                        }
                    }
                    catch (SparkServiceException $e) {

                        if (!$showall) {

                            $output->writeln("");

                            $output->writeln($url);
                        }

                        $output->writeln("<error>".$e->getMessage()."</error>");
                    }
                }

                $i += 1;
            }

        } while (count($list));

        if (!$showall) {
            $output->writeln("");
        }

        $output->writeln("All done ...");
    }
}
