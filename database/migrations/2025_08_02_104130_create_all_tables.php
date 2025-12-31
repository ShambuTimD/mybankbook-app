<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Companies Table
        // Schema::create('timd_hpbms_companies', function (Blueprint $table) {
        //     $table->id();
        //     $table->string('name');
        //     $table->string('email')->unique();
        //     $table->string('phone', 20);
        //     $table->string('alternate_phone', 20)->nullable();
        //     $table->string('website')->nullable();
        //     $table->string('gst_number', 30)->nullable();
        //     $table->string('pan_number', 30)->nullable();
        //     $table->string('industry_type', 100)->nullable();
        //     $table->string('company_size', 50)->nullable();
        //     $table->string('registration_type', 50)->nullable();
        //     $table->string('address_line_1');
        //     $table->string('address_line_2')->nullable();
        //     $table->string('city', 100);
        //     $table->string('state', 100);
        //     $table->string('country', 100);
        //     $table->string('pincode', 20);
        //     $table->string('logo')->nullable();
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // Offices Table
        // Schema::create('timd_hpbms_comp_offices', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('company_id')->constrained('timd_hpbms_companies');
        //     $table->string('name');
        //     $table->string('office_code', 50);
        //     $table->string('email')->nullable();
        //     $table->string('phone', 20)->nullable();
        //     $table->string('address_line_1');
        //     $table->string('address_line_2')->nullable();
        //     $table->string('city', 100);
        //     $table->string('state', 100);
        //     $table->string('country', 100);
        //     $table->string('pincode', 20);
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // HR Users Table
        // Schema::create('timd_hpbms_company_hr_users', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('company_id')->constrained('timd_hpbms_companies');
        //     $table->string('name');
        //     $table->string('email')->unique();
        //     $table->string('password');
        //     $table->string('mobile', 20);
        //     $table->string('role', 50);
        //     $table->string('designation', 100)->nullable();
        //     $table->timestamp('last_login_at')->nullable();
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // Employees Table
        // Schema::create('timd_hpbms_comp_emps', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('company_id')->constrained('timd_hpbms_companies');
        //     $table->foreignId('office_id')->constrained('timd_hpbms_comp_offices');
        //     $table->string('emp_code', 50);
        //     $table->string('name');
        //     $table->string('email');
        //     $table->string('phone', 20);
        //     $table->enum('gender', ['male', 'female', 'other'])->nullable();
        //     $table->date('dob')->nullable();
        //     $table->string('designation', 100);
        //     $table->string('department', 100)->nullable();
        //     $table->date('joining_date')->nullable();
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // Bookings Master Table
        // Schema::create('timd_hpbms_bookings', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('company_id')->constrained('timd_hpbms_companies');
        //     $table->foreignId('office_id')->constrained('timd_hpbms_comp_offices');
        //     $table->string('office_name');
        //     $table->text('office_address');
        //     $table->date('preferred_date')->nullable();
        //     $table->string('preferred_time_slot', 50)->nullable();
        //     $table->string('form_title')->nullable();
        //     $table->string('hr_emp_code', 50)->nullable();
        //     $table->string('hr_name')->nullable();
        //     $table->string('hr_designation', 100)->nullable();
        //     $table->string('hr_email')->nullable();
        //     $table->string('hr_phone', 20)->nullable();
        //     $table->integer('total_employees')->default(0);
        //     $table->integer('total_dependents')->default(0);
        //     $table->boolean('terms_accepted')->default(false);
        //     $table->text('captcha_token')->nullable();
        //     $table->enum('status', ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'cancelled', 'completed'])->default('draft');
        //     $table->timestamp('submitted_on')->nullable();
        //     $table->string('session_id', 100)->nullable();
        //     $table->string('ip_address', 100)->nullable();
        //     $table->text('user_agent')->nullable();
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // Booking Details Table
        // Schema::create('timd_hpbms_booking_details', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('booking_id')->constrained('timd_hpbms_bookings');
        //     $table->enum('type', ['employee', 'dependent']);
        //     $table->string('parent_emp_code', 50)->nullable();
        //     $table->string('emp_code', 50);
        //     $table->string('name');
        //     $table->string('designation', 100)->nullable();
        //     $table->integer('age')->nullable();
        //     $table->enum('gender', ['male', 'female', 'other'])->nullable();
        //     $table->string('email')->nullable();
        //     $table->string('phone', 20)->nullable();
        //     $table->string('relation_to_employee', 50)->nullable();
        //     $table->text('pre_existing_conditions')->nullable();
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // Booking Form Fields Master
        // Schema::create('timd_hpbms_booking_form_fields', function (Blueprint $table) {
        //     $table->id();
        //     $table->string('field_key', 100)->unique();
        //     $table->string('label');
        //     $table->enum('field_type', ['text', 'number', 'email', 'date', 'radio', 'checkbox', 'dropdown', 'textarea']);
        //     $table->string('placeholder')->nullable();
        //     $table->text('help_text')->nullable();
        //     $table->text('default_value')->nullable();
        //     $table->text('options')->nullable();
        //     $table->boolean('is_required')->default(false);
        //     $table->boolean('is_repeatable')->default(false);
        //     $table->string('section', 100)->nullable();
        //     $table->integer('order_no')->default(0);
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });

        // Booking Form Settings Per Company
        // Schema::create('timd_hpbms_comp_booking_form_settings', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('company_id')->constrained('timd_hpbms_companies');
        //     $table->string('field_key', 100);
        //     $table->boolean('is_visible')->default(true);
        //     $table->boolean('is_required')->default(false);
        //     $table->string('custom_label')->nullable();
        //     $table->string('custom_placeholder')->nullable();
        //     $table->text('custom_options')->nullable();
        //     $table->integer('order_no')->nullable();
        //     $table->enum('status', ['active', 'inactive'])->default('active');
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->timestamp('created_on')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->timestamp('updated_on')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamp('deleted_on')->nullable();
        // });
    }

    public function down(): void
    {
        // Schema::dropIfExists('timd_hpbms_comp_booking_form_settings');
        // Schema::dropIfExists('timd_hpbms_booking_form_fields');
        // Schema::dropIfExists('timd_hpbms_booking_details');
        // Schema::dropIfExists('timd_hpbms_bookings');
        // Schema::dropIfExists('timd_hpbms_comp_emps');
        // Schema::dropIfExists('timd_hpbms_company_hr_users');
        // Schema::dropIfExists('timd_hpbms_comp_offices');
        // Schema::dropIfExists('timd_hpbms_companies');
    }
};
