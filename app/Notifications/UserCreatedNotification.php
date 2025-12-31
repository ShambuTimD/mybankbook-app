<?php

namespace App\Notifications;

use App\Settings\AppSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->greeting('Hi ' . $notifiable->name . '!')
            ->subject('Welcome to ' . app(\App\Settings\AppSettings::class)->application_name)
            ->line('Welcome aboard! Your account has been successfully created.')
            ->action('Get Started', url('/dashboard'))
            ->line('If you have any questions, feel free to reach out.')
            ->salutation('Best regards, ' . app(\App\Settings\AppSettings::class)->application_name);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
   public function toArray(object $notifiable): array
{
    return [
        'message' => 'A new user account has been created for you.',
        'long_content' => 'Welcome ' . $notifiable->name . '! You can now log in and access the system.',
        'source' => 'system',
        'notification_type' => 'system_gen',
        'date_time' => now(),
    ];
}

}
