<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $req = Illuminate\Http\Request::create('/api/notes', 'POST', ['id'=>(string)Str::uuid(), 'title'=>'test']);
    $req->setUserResolver(function(){return App\Models\User::first();});
    $res = app()->handle($req);
    echo $res->getContent();
} catch(\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
