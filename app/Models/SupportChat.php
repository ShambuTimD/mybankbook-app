<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportChat extends Model
{
    use HasFactory;

    protected $table = 'support_chats';

    protected $fillable = [
        'ticket_id',
        'sender_id',
        'message',
        'message_type',
        'attachments',   // JSON array of file paths
    ];

    protected $casts = [
        'attachments' => 'array',
    ];

    protected $appends = [
        'attachment_url',   // legacy single file
        'attachment_urls',  // multiple files
    ];

    /* ---------------------------------------------
     * RELATIONSHIPS
     * --------------------------------------------- */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    public function sender()
    {
        return $this->belongsTo(CompanyUser::class, 'sender_id');
    }

    /* ---------------------------------------------
     * MULTIPLE FILES → attachment_urls
     * --------------------------------------------- */
    public function getAttachmentUrlsAttribute()
    {
        if (!$this->attachments) {
            return [];
        }

        return collect($this->attachments)->map(function ($file) {
            return [
                'url'  => asset('uploads/' . $file),
                'name' => basename($file),
            ];
        });
    }


    /* ---------------------------------------------
     * LEGACY SUPPORT FOR SINGLE FILE → attachment_url
     * --------------------------------------------- */
    public function getAttachmentUrlAttribute()
    {
        if (!$this->attachments || count($this->attachments) === 0) {
            return null;
        }

        return asset($this->attachments[0]);
    }
}
