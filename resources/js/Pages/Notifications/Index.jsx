import React from 'react';
import { Link, usePage,Head} from '@inertiajs/react';

export default function NotificationIndex() {
  const { notifications } = usePage().props;

  return (
    <>
    <Head title="Notifications" />
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">All Notifications</h1>

      <div className="bg-white shadow rounded-lg p-4">
        {notifications.data.length === 0 ? (
          <p className="text-gray-500">No notifications found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.data.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-800 font-medium">{item.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.long_content}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.date_time}</p>
                  </div>
                  {item.is_read === 'unread' && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Unread</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-end space-x-2">
          {notifications.links.map((link, idx) => (
            <Link
              key={idx}
              href={link.url || '#'}
              className={`px-3 py-1 rounded text-sm ${
                link.active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
