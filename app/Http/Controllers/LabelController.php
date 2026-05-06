<?php

namespace App\Http\Controllers;

use App\Models\Label;
use Illuminate\Http\Request;

class LabelController extends Controller
{
    public function index(Request $request)
    {
        $labels = Label::where('user_id', $request->user()->id)->get();
        return response()->json([
            'status' => 'success',
            'labels' => $labels
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required|uuid',
            'name' => 'required|string|max:50'
        ]);

        // Support offline UUID sync using updateOrCreate
        $label = Label::updateOrCreate(
            ['id' => $request->id],
            [
                'user_id' => $request->user()->id,
                'name' => $request->name
            ]
        );

        return response()->json([
            'status' => 'success',
            'label' => $label
        ]);
    }

    public function update(Request $request, Label $label)
    {
        if ($label->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:50'
        ]);

        $label->update(['name' => $request->name]);
        return response()->json(['status' => 'success', 'label' => $label]);
    }

    public function destroy(Request $request, Label $label)
    {
        if ($label->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $label->delete(); // Soft delete for offline sync support

        return response()->json(['status' => 'success']);
    }
}
