<?php

use Illuminate\Support\Facades\Route;

Route::get('/run-migrate', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return response()->json([
            'status' => 'success',
            'output' => \Illuminate\Support\Facades\Artisan::output()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
});

// Catch-all route cho React Router, loại trừ các route của hệ thống
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|up|run-migrate).*$');

require __DIR__.'/auth.php';
