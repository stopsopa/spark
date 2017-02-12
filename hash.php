<?php

class Helper {
    public static function hash($url) {

        if (!$url) {
            throw new Exception("Url not specified");
        }

        preg_match('#^https?://(?:[^/]+)(.*)$#', $url, $match);

        if (count($match) === 2) {
            $url = $match[1];
        }

        return sha1($url);
    }
}

if (!empty($_SERVER['argv'][1])) {
    $url = $_SERVER['argv'][1];
    echo "\n" . $url . "\n";
    echo Helper::hash($url);
    echo "\n";
}
else {
    echo "\nurl not specified\n";
}