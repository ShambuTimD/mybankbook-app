<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {

            // FIXED: office_id must match foreign table type
            $table->unsignedBigInteger('office_id')->after('user_id')->nullable()->comment('Selected office id in ticket create');

            $table->unsignedBigInteger('media_id')->after('office_id')->nullable()->comment('Attachment file ID');

            // Foreign key: office
            $table->foreign('office_id')->references('id')->on('timd_hpbms_comp_offices')->onDelete('cascade');

            // Foreign key: media
            $table->foreign('media_id')->references('id')->on('media')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {

            // Drop FKs individually
            $table->dropForeign(['office_id']);
            $table->dropForeign(['media_id']);

            // Drop columns
            $table->dropColumn(['office_id', 'media_id']);
        });
    }
};
