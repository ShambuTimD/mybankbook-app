<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SupportTicket extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $table = 'support_tickets';

    // ✅ 1. Append 'attachment' so it appears in the JSON for DataTables
    protected $appends = ['attachment'];

    protected $fillable = [
        'ticket_id',
        'user_id',
        'office_id',
        'media_id',
        'subject',
        'category',
        'priority',
        'description',
        'status',
        'assigned_to',
        'created_by',
        'updated_by',
    ];

    // --- Relationships ---

    public function user()
    {
        return $this->belongsTo(CompanyUser::class, 'user_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function office()
    {
        return $this->belongsTo(CompanyOffice::class, 'office_id');
    }

    public function chats()
    {
        return $this->hasMany(SupportChat::class, 'ticket_id');
    }

    // --- Media Configuration ---

    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('ticket_attachments')
            ->useDisk('uploads'); // Ensure this matches your filesystems.php
    }

    // --- Accessors ---

    // ✅ 2. Get the full URL of the uploaded file
    public function getAttachmentAttribute()
    {
        // 'ticket_attachments' must match the collection name used during upload
        return $this->getFirstMediaUrl('ticket_attachments');
    }
}