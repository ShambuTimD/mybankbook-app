<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('timd_hpbms_booking_master', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('office_id');
            $table->unsignedBigInteger('company_user_id')->nullable();
            $table->string('brn', 100)->unique(); // Booking Reference Number
            $table->date('pref_appointment_date')->nullable();
            $table->enum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->integer('total_employees')->default(0);
            $table->integer('total_dependents')->default(0);
            $table->text('notes')->nullable();
            $table->string('sid')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('created_on')->nullable();
            $table->timestamp('updated_on')->nullable();
            $table->timestamp('deleted_on')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('timd_hpbms_booking_master');
    }
};
