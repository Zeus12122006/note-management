<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserPreferenceController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'theme' => 'in:light,dark',
            'font_size' => 'in:small,medium,large',
            'note_color' => 'string'
        ]);

        $user = $request->user();
        $user->update($request->only('theme', 'font_size', 'note_color'));

        return response()->json([
            'status' => 'success',
            'user' => $user
        ]);
    }
}
