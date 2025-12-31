<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FAQCategory;
use App\Models\FAQs;

class FAQSeeder extends Seeder
{
    public function run()
    {
        // --- Create FAQ Categories ---
        $categories = [
            [
                'name' => 'General',
                'slug' => 'general',
                'sort_order' => 1
            ],
            [
                'name' => 'Account',
                'slug' => 'account',
                'sort_order' => 2
            ],
            [
                'name' => 'Billing',
                'slug' => 'billing',
                'sort_order' => 3
            ],
        ];

        foreach ($categories as $cat) {
            FAQCategory::create($cat);
        }

        // --- FAQs ---
        $faqs = [
            [
                'category_id' => 1,
                'question' => 'What is this service about?',
                'answer' => 'This service helps you manage your data and workflow efficiently.',
                'sort_order' => 1
            ],
            [
                'category_id' => 1,
                'question' => 'How can I contact support?',
                'answer' => 'You can contact support through email or live chat.',
                'sort_order' => 2
            ],
            [
                'category_id' => 2,
                'question' => 'How do I reset my password?',
                'answer' => 'Go to the login page and click "Forgot Password".',
                'sort_order' => 1
            ],
            [
                'category_id' => 3,
                'question' => 'How do I update my billing information?',
                'answer' => 'Navigate to Billing in your dashboard and update your card details.',
                'sort_order' => 1
            ],
        ];

        foreach ($faqs as $faq) {
            FAQs::create($faq);
        }
    }
}
