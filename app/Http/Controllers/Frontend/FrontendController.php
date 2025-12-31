<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FrontendController extends Controller
{
    public function settings()
    {
        $settingsRaw = DB::table('settings')
            ->where('group', 'default')
            ->get(['name', 'payload']); // get as collection

        $settings = [];
        foreach ($settingsRaw as $item) {
            // Remove extra quotes and decode any escaped slashes
            $value = trim($item->payload, '"'); // remove surrounding quotes
            $value = str_replace('\\/', '/', $value); // fix escaped slashes
            $settings[$item->name] = $value;
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings retrieved successfully',
            'data' => [
                'app_name' => $settings['application_name'] ?? config('app.name'),
                'version' => $settings['application_version'] ?? null,
                'settings' => $settings,
            ],
        ]);
    }

    public function notification()
    {
        // Example: Fetch notifications from the database
        $notifications = DB::table('notifications')
            ->where('created_by', auth()->id())
            ->where('is_read', 'unread')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
        ]);
    }

    public function notificationUpdate($id)
    {
        $userId = auth()->id();

        // Update the notification
        DB::table('notifications')
            ->where('id', $id)
            ->where('created_by', $userId)
            ->update(['is_read' => 'read']);

        // Fetch the updated record
        $updatedNotification = DB::table('notifications')
            ->where('id', $id)
            ->where('created_by', $userId)
            ->first();

        if (!$updatedNotification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found or unauthorized access.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification updated successfully.',
            'data' => $updatedNotification,
        ]);
    }

    public function notificationDelete($id)
    {
        $userId = auth()->id();

        // Check if notification exists & belongs to logged-in user
        $notification = DB::table('notifications')
            ->where('id', $id)
            ->where('created_by', $userId)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found or unauthorized.',
            ], 404);
        }

        // Delete the notification
        DB::table('notifications')
            ->where('id', $id)
            ->where('created_by', $userId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully.',
        ]);
    }

    public function notificationDeleteAll()
    {
        $userId = auth()->id();

        // Delete all notifications created by this user
        $deleted = DB::table('notifications')
            ->where('created_by', $userId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'All notifications deleted successfully.',
            'deleted_count' => $deleted,
        ]);
    }
}
