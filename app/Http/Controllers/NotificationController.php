<?php
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
public function index()
{
    $user = Auth::user();

    // Temporary debug — remove this once tested
    \Log::info('Notification Index', ['user_id' => $user->id]);

    $notifications = Notification::query()
        ->orderBy('date_time', 'desc')
        ->paginate(10)
        ->through(function ($item) {
            return [
                'id' => $item->id,
                'message' => $item->message,
                'long_content' => $item->long_content,
                'is_read' => $item->is_read,
                'date_time' => optional($item->date_time)->diffForHumans(),
            ];
        });

    return Inertia::render('Notifications/Index', [
        'notifications' => $notifications,
    ]);
}



    public function fetch()
{
    $notifications = Notification::orderBy('date_time', 'desc')
        ->limit(10)
        ->get(['id', 'message', 'long_content', 'is_read', 'date_time']);

    return response()->json($notifications);
}

    public function markRead($id)
{
    $notification = \App\Models\Notification::find($id);

    if ($notification && $notification->is_read === 'unread') {
        $notification->update(['is_read' => 'read']);
    }

    return back();
}

public function markAllRead()
{
    \App\Models\Notification::where('user_id', Auth::id())
        ->where('is_read', 'unread')
        ->update(['is_read' => 'read']);

    return back();
}
}
