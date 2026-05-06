<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'display_name' => $request->display_name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        // Send activation email
        event(new Registered($user));

        // Auto login
        Auth::login($user);

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'message' => 'Registration successful. Activation email sent.'
        ], 201);
    }
}
