<?php

$array = explode(' ', 'raz dwa trzy cztery piec szesc siedem osiem dziewiec dziesiec');

shuffle($array);

$file = 'change.json';
$data = array();

if (file_exists($file)) {
    $data = json_decode(file_get_contents($file), true) ?: array();
}

if (empty($data['etag'])) {
    $data['etag'] = sha1(uniqid() . time());
}

if (empty($data['last'])) {
    $data['last'] = time();
}

file_put_contents($file, json_encode($data));

header('Content-type: application/json; charset=utf-8');
header("Last-Modified: ".gmdate("D, d M Y H:i:s", $data['last'])." GMT");
header("Etag: ".$data['etag']);
header('Cache-Control: cache');
header("Pragma: cache");

$expires = 60 * 60 * 5; // hours

header("Expires: ".gmdate("D, d M Y H:i:s", $data['last'] + $expires) . " GMT");

echo 'go(' . json_encode($array) . ')';

