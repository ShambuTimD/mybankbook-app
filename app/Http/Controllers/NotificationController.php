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

    $notifications = Notification::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->orWhere('customer_id', $user->id);
        })
        ->orderBy('date_time', 'desc')
        ->paginate(10)
        ->through(function ($item) {
            return [
                'id' => $item->id,
                'message' => $item->message,
                'long_content' => $item->long_content,
                'is_read' => $item->is_read,
                'date_time' => $item->date_time->diffForHumans(),
            ];
        });

    return Inertia::render('Notifications/Index', [
        'notifications' => $notifications,
    ]);
}
    public function fetch()
    {
        $user = Auth::user();

        $notifications = Notification::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('customer_id', $user->id);
            })
            ->orderBy('date_time', 'desc')
            ->limit(10)
            ->get(['id', 'message', 'long_content', 'is_read', 'date_time']);

        return response()->json($notifications);
    }
}
