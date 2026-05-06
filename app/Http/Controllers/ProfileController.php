<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $request->validate(['display_name' => 'required|string|max:255']);
        $user = $request->user();
        $user->update(['display_name' => $request->display_name]);
        return response()->json(['status' => 'success', 'user' => $user]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $user = $request->user();
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);
        return response()->json(['status' => 'success', 'user' => $user->fresh()]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => ['required', 'confirmed', Password::defaults()],
        ]);
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu hiện tại không chính xác'], 422);
        }
        $user->update(['password' => $request->new_password]);
        return response()->json(['status' => 'success', 'message' => 'Đổi mật khẩu thành công']);
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();
        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email đã được xác thực'], 400);
        }
        $user->sendEmailVerificationNotification();
        return response()->json(['status' => 'success', 'message' => 'Email xác thực đã được gửi lại']);
    }
}
