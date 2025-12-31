<?php

namespace App\Http\Controllers;

// use App\Http\Controllers\Controller;

use App\Models\CompanyUser;
use App\Models\SupportTicket;
use App\Models\SupportChat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Str;
use ZipArchive;
use Illuminate\Support\Facades\File;


class SupportTicketController extends Controller
{
    // ---------------------------
    // ADMIN: Tickets List Page
    // ---------------------------
    public function index()
    {
        return inertia('Tickets/Index', [
            'title' => 'Support Tickets',
        ]);
    }

    // ---------------------------
    // AJAX List for DataTable
    // ---------------------------
    public function list(Request $request)
    {
        $tickets = SupportTicket::with(['user:id,name', 'assignedTo:id,name'])
            ->orderByDesc('created_at');

        // Optional Filters
        if ($request->status) {
            $tickets->where('status', $request->status);
        }
        if ($request->priority) {
            $tickets->where('priority', $request->priority);
        }
        if ($request->category) {
            $tickets->where('category', $request->category);
        }

        return DataTables::of($tickets)
            ->addColumn('user', fn($t) => $t->user->name ?? '-')
            ->addColumn('assigned_to', fn($t) => $t->assignedTo->name ?? 'Unassigned')
            ->addColumn('created_on', fn($t) => $t->created_at->format('Y-m-d H:i'))
            ->addColumn('updated_on', fn($t) => $t->updated_at->format('Y-m-d H:i'))
            ->addColumn('action', fn($t) => [
                'view_url' => route('support.tickets.view', $t->id),
                'delete_url' => route('support.tickets.delete', $t->id),
            ])
            ->toJson();
    }

    // ---------------------------
    // ADMIN: View Ticket
    // ---------------------------
    public function view(Request $request, $id)
    {
        $ticket = SupportTicket::with([
            'media', // ✅ ADD THIS
            'user:id,name,email',
            'assignedTo:id,name,email',
            'chats.sender:id,name'
        ])->findOrFail($id);

        $admins = CompanyUser::select('id', 'name')->get();

        // AJAX requests (chat refresh, status update)
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'ticket' => $ticket,
                'admins' => $admins,
            ]);
        }

        // Inertia page load
        return Inertia::render('Tickets/View', [
            'ticket' => $ticket,
            'admins' => $admins,
        ]);
    }


    public function create()
    {
        // Customers = Company Users
        $customers = CompanyUser::select(
            'id as value',
            'name as label'
        )->get();

        return Inertia::render('Tickets/Create', [
            'title'     => 'Create Support Ticket',
            'customers' => $customers,
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'     => 'required|exists:timd_hpbms_comp_users,id',
            'subject'     => 'required|string|max:255',
            'category'    => 'required|string|max:100',
            'priority'    => 'required|in:Low,Medium,High',
            'description' => 'nullable|string',
        ]);

        // Auto Ticket Number
        $ticketNo = "TCK-" . strtoupper(Str::random(8));

        $ticket = SupportTicket::create([
            'ticket_id'   => $ticketNo,
            'user_id'     => $validated['user_id'],
            'subject'     => $validated['subject'],
            'category'    => $validated['category'],
            'priority'    => $validated['priority'],
            'description' => $validated['description'] ?? null,
            'status'      => 'Open',
            'created_by'  => auth()->id(),
        ]);

        return redirect()
            ->route('support.tickets.view', $ticket->id)
            ->with('success', 'Ticket created successfully!');
    }






    // ---------------------------
    // ADMIN: Assign Ticket
    // ---------------------------
    public function assign(Request $request, $id)
    {
        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $ticket->assigned_to = $request->assigned_to;
        $ticket->status = 'In Progress';
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Ticket assigned successfully',
        ]);
    }

    // ---------------------------
    // ADMIN: Update Ticket Status
    // ---------------------------
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Open,In Progress,Resolved,Closed'
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $ticket->status = $request->status;
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
        ]);
    }

    // ---------------------------
    // ADMIN: Add chat reply
    // ---------------------------
    public function reply(Request $request, $id)
    {
        $request->validate([
            'message' => 'nullable|string',
            'attachments' => 'nullable',
            'attachments.*' => 'file|max:102400',
        ]);

        $files = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {

                $filename = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();

                // Save file in /public/uploads
                $file->move(public_path('uploads'), $filename);

                // FIX: Save only correct path
                $files[] = $filename;
            }
        }

        SupportChat::create([
            'ticket_id'   => $id,
            'sender_id'   => auth()->id(),
            'message'     => $request->message,
            'message_type' => $files ? 'files' : 'text',
            'attachments' => $files,
        ]);

        return response()->json(['success' => true]);
    }




    // ---------------------------
    // ADMIN: Delete Ticket
    // ---------------------------
    public function delete($id)
    {
        SupportTicket::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ticket deleted successfully',
        ]);
    }



    public function downloadZip(SupportChat $chat)
    {
        $zip = new \ZipArchive();
        $timestamp = now()->format('Ymd_His');
        $zipName = "chat_{$chat->id}_attachments_{$timestamp}.zip";
        $zipPath = public_path("temp/" . $zipName);

        // Ensure temp folder exists
        if (!file_exists(public_path("temp"))) {
            mkdir(public_path("temp"), 0777, true);
        }

        // Create ZIP
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== TRUE) {
            return response()->json(['error' => 'ZIP not created'], 500);
        }

        // ADD FILES FROM uploads folder
        foreach ($chat->attachments ?? [] as $file) {

            $path = public_path("uploads/" . $file);

            if (file_exists($path)) {
                $zip->addFile($path, basename($path));
            }
        }

        $zip->close();

        // Validate ZIP exists
        if (!file_exists($zipPath)) {
            return response()->json(['error' => 'ZIP missing after creation'], 500);
        }

        return response()->download($zipPath)->deleteFileAfterSend();
    }
}
