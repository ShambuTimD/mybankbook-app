<?php

namespace App\Http\Controllers\Frontend\Support;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\SupportChat;
use ZipArchive;

class TicketController extends Controller
{
    /**
     * SHOW INERTIA PAGE FOR TICKETS LIST
     */
    public function index()
    {
        return Inertia::render('Support/Tickets/Index', [
            'title' => 'My Support Tickets',
        ]);
    }

    /**
     * RETURN ALL USER TICKETS (JSON)
     */
    public function list()
    {
        $tickets = SupportTicket::with('office')
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Ticket list retrieved successfully",
            'data'    => $tickets,
        ]);
    }

    /**
     * NEW TICKET CREATE PAGE
     */
    public function create()
    {
        return Inertia::render('Support/Tickets/Create', [
            'title' => 'Create New Ticket',
        ]);
    }

    /**
     * STORE NEW TICKET
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'         => 'required|string|max:255',
            'description'     => 'nullable|string',
            'office_location' => 'required|integer',
            'priority'        => 'required|string|max:50',
            'category'        => 'required|string|max:100',
            'attachment'      => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx,zip|max:20480',
        ]);

        $user = Auth::user();

        $ticketNo = "TCK-" . strtoupper(Str::random(8));

        $ticket = SupportTicket::create([
            'ticket_id'   => $ticketNo,
            'user_id'     => $user->id,
            'office_id'   => $validated['office_location'],
            'subject'     => $validated['subject'],
            'category'    => $validated['category'],
            'priority'    => $validated['priority'],
            'description' => $validated['description'] ?? "",
            'status'      => 'Open',
            'created_by'  => $user->id,
        ]);

        // SPATIE MEDIA LIBRARY – FOR INITIAL ATTACHMENT
        if ($request->hasFile('attachment')) {
            $media = $ticket
                ->addMediaFromRequest('attachment')
                ->toMediaCollection('ticket_attachments');

            $ticket->update([
                'media_id' => $media->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket created successfully.',
            'ticket'  => $ticket,
        ]);
    }

    /**
     * SHOW A SINGLE TICKET + CHAT MESSAGES
     */
    public function show($id)
    {
        $ticket = SupportTicket::with([
            'chats.sender:id,name'
        ])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Convert every stored filename → full URL
        $messages = $ticket->chats->map(function ($chat) {
            $chat->attachment_urls = collect($chat->attachments ?: [])
                ->map(fn($file) => asset("uploads/" . $file));
            return $chat;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'ticket'   => $ticket,
                'messages' => $messages,
            ]
        ]);
    }

    /**
     * DELETE TICKET
     */
    public function destroy($id)
    {
        $ticket = SupportTicket::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $ticket->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ticket deleted',
        ]);
    }



    public function downloadZip(SupportChat $chat)
    {
        $zip = new ZipArchive();
        $timestamp = now()->format('Ymd_His');
        $zipName = "chat_{$chat->id}_attachments_{$timestamp}.zip";
        $zipPath = public_path("temp/" . $zipName);

        if (!file_exists(public_path("temp"))) {
            mkdir(public_path("temp"), 0777, true);
        }

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
            return response()->json(['error' => 'ZIP not created'], 500);
        }

        foreach ($chat->attachments ?? [] as $file) {
            $path = public_path("uploads/" . $file);
            if (file_exists($path)) {
                $zip->addFile($path, basename($path));
            }
        }

        $zip->close();

        return response()->download($zipPath)->deleteFileAfterSend();
    }
}
