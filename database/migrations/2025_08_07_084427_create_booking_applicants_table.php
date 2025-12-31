<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // public function up()
    // {
    //     Schema::create('timd_hpbms_booking_applicants', function (Blueprint $table) {
    //         $table->id();
    //         $table->unsignedBigInteger('booking_id');
    //         $table->unsignedBigInteger('company_id');
    //         $table->unsignedBigInteger('office_id');
    //         $table->enum('applicant_type', ['employee', 'dependent']);
    //         $table->unsignedBigInteger('emp_id')->nullable();         // From employee master
    //         $table->unsignedBigInteger('dependent_id')->nullable();   // From dependent master

    //         // Snapshot data
    //         $table->string('full_name');
    //         $table->enum('gender', ['male', 'female', 'other'])->nullable();
    //         $table->integer('age')->nullable();
    //         $table->string('designation')->nullable(); // for employee
    //         $table->string('relation')->nullable();    // for dependent
    //         $table->string('email')->nullable();
    //         $table->string('phone')->nullable();
    //         $table->text('medical_conditions')->nullable();
    //         $table->text('remarks')->nullable();

    //         $table->enum('status', ['scheduled', 'attended', 'cancelled'])->default('scheduled');
    //         $table->timestamps();

    //         $table->foreign('booking_id')->references('id')->on('timd_hpbms_bookings')->onDelete('cascade');
    //         $table->foreign('company_id')->references('id')->on('timd_hpbms_companies')->onDelete('cascade');
    //         $table->foreign('office_id')->references('id')->on('timd_hpbms_comp_offices')->onDelete('cascade');
    //         $table->foreign('emp_id')->references('id')->on('employees')->onDelete('set null');
    //         $table->foreign('dependent_id')->references('id')->on('timd_hpbms_dependents')->onDelete('set null');
    //     });
    // }

    // public function down()
    // {
    //     Schema::dropIfExists('timd_hpbms_booking_applicants');
    // }
};
