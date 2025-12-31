<?php

namespace App\Http\Controllers\Frontend\Support;

use App\Http\Controllers\Controller;
use App\Models\SupportChat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * FETCH ALL CHAT MESSAGES FOR A TICKET
     */
    public function fetch($ticket_id)
    {
        $chats = SupportChat::with('sender:id,name')
            ->where('ticket_id', $ticket_id)
            ->orderBy('created_at')
            ->get()
            ->map(function ($chat) {

                // Convert each stored filename → full URL
                $chat->attachment_urls = collect($chat->attachments ?: [])
                    ->map(fn($file) => asset("uploads/" . $file));

                return $chat;
            });

        return response()->json([
            'success' => true,
            'data'    => $chats
        ]);
    }

    /**
     * SEND CHAT MESSAGE WITH OPTIONAL MULTIPLE FILES
     */
    public function send(Request $request)
    {
        $request->validate([
            'ticket_id'          => 'required|exists:support_tickets,id',
            'message'            => 'nullable|string',
            'attachments'        => 'nullable',
            'attachments.*'      => 'file|max:102400' // 100MB each
        ]);

        if (!$request->message && !$request->hasFile('attachments')) {
            return response()->json([
                'success' => false,
                'error'   => 'Message or file required'
            ], 422);
        }

        $savedFiles = [];

        // MULTIPLE FILE UPLOAD LOOP
        if ($request->hasFile('attachments')) {

            foreach ($request->file('attachments') as $file) {

                $ext = $file->getClientOriginalExtension();
                $filename = time() . "-" . uniqid() . "." . $ext;

                // save to public/uploads
                $file->move(public_path("uploads"), $filename);

                $savedFiles[] = $filename;
            }
        }

        // Save Chat
        $chat = SupportChat::create([
            'ticket_id'   => $request->ticket_id,
            'sender_id'   => Auth::id(),
            'message'     => $request->message ?? "",
            'message_type'=> count($savedFiles) ? "files" : "text",
            'attachments' => $savedFiles,
        ]);

        // Add full URLs for response
        $chat->attachment_urls = collect($savedFiles)
            ->map(fn($file) => asset("uploads/" . $file));

        return response()->json([
            'success' => true,
            'data'    => $chat
        ]);
    }
}
