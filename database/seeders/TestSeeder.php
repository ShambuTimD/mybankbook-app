<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TestSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $cat = DB::table('test_categories')->pluck('id', 'slug');

        $tests = [

            /* ================= PATHOLOGY ================= */
            ['CBC', 'Complete Blood Count', 'pathology', 'blood', 'Blood', false],
            ['HB', 'Hemoglobin', 'pathology', 'blood', 'Blood', false],
            ['ESR', 'ESR', 'pathology', 'blood', 'Blood', false],
            ['FBS', 'Fasting Blood Sugar', 'pathology', 'blood', 'Blood', true],
            ['PPBS', 'Post Prandial Blood Sugar', 'pathology', 'blood', 'Blood', false],
            ['RBS', 'Random Blood Sugar', 'pathology', 'blood', 'Blood', false],
            ['HBA1C', 'HbA1c', 'pathology', 'blood', 'Blood', false],
            ['LIPID', 'Lipid Profile', 'pathology', 'blood', 'Blood', true],
            ['LFT', 'Liver Function Test', 'pathology', 'blood', 'Blood', false],
            ['KFT', 'Kidney Function Test', 'pathology', 'blood', 'Blood', false],
            ['TSH', 'Thyroid Stimulating Hormone', 'pathology', 'blood', 'Blood', false],
            ['T3', 'Triiodothyronine (T3)', 'pathology', 'blood', 'Blood', false],
            ['T4', 'Thyroxine (T4)', 'pathology', 'blood', 'Blood', false],
            ['VITD', 'Vitamin D (25-OH)', 'pathology', 'blood', 'Blood', false],
            ['VITB12', 'Vitamin B12', 'pathology', 'blood', 'Blood', false],
            ['IRON', 'Serum Iron', 'pathology', 'blood', 'Blood', false],
            ['FERR', 'Ferritin', 'pathology', 'blood', 'Blood', false],
            ['CRP', 'C-Reactive Protein', 'pathology', 'blood', 'Blood', false],
            ['URINE_R', 'Urine Routine & Microscopy', 'pathology', 'urine', 'Urine', false],
            ['URINE_C', 'Urine Culture', 'pathology', 'urine', 'Urine', false],

            /* ================= RADIOLOGY ================= */
            ['XRAY_CHEST', 'Chest X-Ray', 'radiology', 'imaging', null, false],
            ['USG_ABD', 'USG Abdomen', 'radiology', 'imaging', null, false],
            ['MAMMO', 'Mammography', 'radiology', 'imaging', null, false],
            ['DEXA', 'Dexa Scan', 'radiology', 'imaging', null, false],

            /* ================= CARDIAC ================= */
            ['ECG', 'Electrocardiogram', 'cardiac', 'imaging', null, false],
            ['ECHO', '2D Echocardiography', 'cardiac', 'imaging', null, false],
            ['TMT', 'Treadmill Test', 'cardiac', 'imaging', null, false],

            /* ================= PHYSICAL ================= */
            ['HEIGHT', 'Height Measurement', 'physical', 'physical', null, false],
            ['WEIGHT', 'Weight Measurement', 'physical', 'physical', null, false],
            ['BMI', 'Body Mass Index', 'physical', 'physical', null, false],
            ['BP', 'Blood Pressure', 'physical', 'physical', null, false],
            ['SPO2', 'Oxygen Saturation', 'physical', 'physical', null, false],

            /* ================= WELLNESS ================= */
            ['HRA', 'Health Risk Assessment', 'wellness', 'physical', null, false],
            ['STRESS', 'Stress Assessment', 'wellness', 'physical', null, false],
            ['SLEEP', 'Sleep Assessment', 'wellness', 'physical', null, false],

            /* ================= DENTAL ================= */
            ['DENTAL_EXAM', 'Dental Examination', 'dental', 'physical', null, false],

            /* ================= VISION ================= */
            ['VISION', 'Vision Test', 'vision', 'physical', null, false],
            ['COLOR', 'Color Blindness Test', 'vision', 'physical', null, false],

            /* ================= VACCINATION ================= */
            ['FLU', 'Influenza Vaccine', 'vaccination', 'physical', null, false],
            ['HEPB', 'Hepatitis B Vaccine', 'vaccination', 'physical', null, false],
            ['COVID', 'COVID-19 Vaccine', 'vaccination', 'physical', null, false],
        ];

        foreach ($tests as $t) {
            DB::table('tests')->insert([
                'test_code' => $t[0],
                'test_name' => $t[1],
                'test_category_id' => $cat[$t[2]],
                'test_type' => $t[3],
                'sample_type' => $t[4],
                'fasting_required' => $t[5],
                'tat_hours' => 24,
                'status' => 'active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
