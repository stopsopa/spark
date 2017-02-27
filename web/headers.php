<?php

// i should test if header User-Agent provided by nightmare

//    [UNIQUE_ID] => WLLFUta59nMW1PCm68xPWQAAAAU
//    [SCRIPT_URL] => /headers.php
//    [SCRIPT_URI] => http://www.domain.com/headers.php
//    [HTTP_HOST] => www.domain.com
//    [HTTP_CONNECTION] => keep-alive
//    [HTTP_UPGRADE_INSECURE_REQUESTS] => 1
//    [HTTP_USER_AGENT] => Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Electron/1.4.14 Safari/537.36
//    [HTTP_ACCEPT] => text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
//    [HTTP_ACCEPT_ENCODING] => gzip, deflate
//    [HTTP_ACCEPT_LANGUAGE] => en-US
//    [PATH] => /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
//    [SERVER_SIGNATURE] =>
//    [SERVER_SOFTWARE] => Apache/2.4.6 (CentOS)
//    [SERVER_NAME] => www.domain.com
//    [SERVER_ADDR] => xxxx
//    [SERVER_PORT] => 80
//    [REMOTE_ADDR] => xxx
//    [DOCUMENT_ROOT] => /var/www/current/web
//    [REQUEST_SCHEME] => http
//    [CONTEXT_PREFIX] =>
//    [CONTEXT_DOCUMENT_ROOT] => /var/www/current/web
//    [SERVER_ADMIN] => admin@domain.com
//    [SCRIPT_FILENAME] => /var/www/current/web/headers.php
//    [REMOTE_PORT] => 60716
//    [GATEWAY_INTERFACE] => CGI/1.1
//    [SERVER_PROTOCOL] => HTTP/1.1
//    [REQUEST_METHOD] => GET
//    [QUERY_STRING] =>
//    [REQUEST_URI] => /headers.php
//    [SCRIPT_NAME] => /headers.php
//    [PHP_SELF] => /headers.php
//    [REQUEST_TIME_FLOAT] => 1488110930.41
//    [REQUEST_TIME] => 1488110930
//    [argv] =>  Array
//        (
//        )
//
//    [argc] => 0

echo json_encode(array(
    'json' => json_decode(file_get_contents("php://input"), true) ?: array(),
    'get' => $_GET,
    'post' => $_POST,
    'cookies' => $_COOKIE,
    'server' => $_SERVER
));