<?php

use Illuminate\Support\Facades\Route;

// Catch-all route cho React Router, loại trừ các route của hệ thống
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|up).*$');

require __DIR__.'/auth.php';
