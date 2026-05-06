<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Password;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserPreferenceController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\SyncController;

// Đăng nhập, đăng ký
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Quên mật khẩu / Đặt lại mật khẩu (không cần auth)
Route::post('/forgot-password', function (Request $request) {
    $request->validate(['email' => 'required|email']);
    $status = Password::sendResetLink($request->only('email'));
    if ($status === Password::RESET_LINK_SENT) {
        return response()->json(['status' => 'success', 'message' => 'Link đặt lại mật khẩu đã được gửi tới email của bạn.']);
    }
    return response()->json(['message' => 'Không tìm thấy tài khoản với email này.'], 422);
});

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token'    => 'required',
        'email'    => 'required|email',
        'password' => 'required|confirmed|min:8',
    ]);
    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->update(['password' => $password]);
        }
    );
    if ($status === Password::PASSWORD_RESET) {
        return response()->json(['status' => 'success', 'message' => 'Mật khẩu đã được đặt lại thành công.']);
    }
    return response()->json(['message' => 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'], 422);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(Request $r) => $r->user());
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // Đồng bộ Offline
    Route::post('/sync', [SyncController::class, 'sync']);

    // User Preferences
    Route::put('/user/preferences', [UserPreferenceController::class, 'update']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/email/resend-verification', [ProfileController::class, 'resendVerification']);

    // Notes
    Route::get('/notes', [NoteController::class, 'index']);
    Route::post('/notes', [NoteController::class, 'store']);
    Route::put('/notes/{note}', [NoteController::class, 'update']);
    Route::delete('/notes/{note}', [NoteController::class, 'destroy']);
    Route::post('/notes/{note}/pin', [NoteController::class, 'togglePin']);

    // Note Password
    Route::post('/notes/{note}/lock', [NoteController::class, 'lock']);
    Route::post('/notes/{note}/unlock', [NoteController::class, 'unlock']);
    Route::put('/notes/{note}/password', [NoteController::class, 'updateLockPassword']);

    // Note Collaboration
    Route::post('/notes/{note}/share', [NoteController::class, 'share']);
    Route::delete('/notes/{note}/share', [NoteController::class, 'revokeShare']);

    // Note Attachments
    Route::post('/notes/{note}/attachments', [NoteController::class, 'storeAttachment']);
    Route::delete('/attachments/{attachment}', [NoteController::class, 'deleteAttachment']);

    // Note Labels
    Route::post('/notes/{note}/labels', [NoteController::class, 'toggleLabel']);

    // Labels
    Route::get('/labels', [LabelController::class, 'index']);
    Route::post('/labels', [LabelController::class, 'store']);
    Route::put('/labels/{label}', [LabelController::class, 'update']);
    Route::delete('/labels/{label}', [LabelController::class, 'destroy']);
});


