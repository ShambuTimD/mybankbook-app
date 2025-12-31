<?php

namespace App\Http\Controllers;

use App\Models\SupportChat;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Yajra\DataTables\DataTables;

class SupportChatController extends Controller
{
    public function index()
    {
        return inertia('Chats/Index', [
            'title' => 'Support Chat Logs',
        ]);
    }
    public function list(Request $request)
    {
        $query = SupportChat::with(['ticket:id,ticket_id', 'sender:id,name'])
            ->select('support_chats.*');

        return DataTables::of($query)

            // 🔍 ENABLE SEARCH FILTER
            ->filter(function ($instance) use ($request) {
                if ($search = $request->get('search')['value']) {

                    $instance->where(function ($q) use ($search) {

                        // search inside support_chats table
                        $q->where('message', 'like', "%{$search}%")
                            ->orWhere('id', 'like', "%{$search}%");

                        // search in sender name
                        $q->orWhereHas('sender', function ($s) use ($search) {
                            $s->where('name', 'like', "%{$search}%");
                        });

                        // search in ticket number
                        $q->orWhereHas('ticket', function ($t) use ($search) {
                            $t->where('ticket_id', 'like', "%{$search}%");
                        });
                    });
                }
            })

            ->addColumn('ticket_no', fn($r) => $r->ticket->ticket_id ?? '-')
            ->addColumn('sender', fn($r) => $r->sender->name ?? 'Unknown')
            ->addColumn('message', fn($r) => $r->message)
            ->addColumn('created_on', fn($r) => $r->created_at->format('Y-m-d H:i'))

            ->make(true);
    }

    
}
