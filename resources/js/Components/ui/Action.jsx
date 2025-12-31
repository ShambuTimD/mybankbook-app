// resources/js/Components/ui/Action.jsx
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Transition } from '@headlessui/react';

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisVertical,
  faEye,               // 👈 added for View
  faPenToSquare,
  faTrash,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

/* =========================
   Reusable Modal Component
   ========================= */
export const Modal = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? 'w-full h-full'
    : 'relative w-full rounded-3xl bg-white dark:bg-gray-900';

  return (
    <div className="fixed inset-0 z-[99999] modal flex items-center justify-center overflow-y-auto">
      {!isFullscreen && (
        <div
          className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
          onClick={onClose}
        />
      )}
      <div
        ref={modalRef}
        className={`${contentClasses} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-[999] flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

/* =========================
   Action Menu (with View)
   ========================= */
export default function ActionMenu({ onView, onEdit, onDelete, extra = [] }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleView = () => { setOpen(false); onView && onView(); };
  const handleEdit = () => { setOpen(false); onEdit && onEdit(); };
  const handleDeleteClick = () => { setOpen(false); setConfirmOpen(true); };
  const handleConfirmDelete = () => { setConfirmOpen(false); onDelete && onDelete(); };
  const handleCancelDelete = () => setConfirmOpen(false);

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-colors"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <span className="sr-only">Open options</span>
          <FontAwesomeIcon icon={faEllipsisVertical} className="w-5 h-5" />
        </button>

        {/* Menu */}
        <Transition
          show={open}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div
            className="absolute right-0 z-20 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-white/10"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-2" role="none">
              {onView && (
                <button
                  onClick={handleView}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  role="menuitem"
                >
                  <FontAwesomeIcon icon={faEye} className="w-5 h-5 mr-3" />
                  <span>View</span>
                </button>
              )}

              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  role="menuitem"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="w-5 h-5 mr-3" />
                  <span>Edit</span>
                </button>
              )}

              {extra.map((x, i) => (
                <button
                  key={i}
                  onClick={() => { setOpen(false); x.onClick(); }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  role="menuitem"
                >
                  {x.icon ? <span className="w-5 h-5 mr-3">{x.icon}</span> : null}
                  <span>{x.label}</span>
                </button>
              ))}

              {onDelete && (
                <>
                  <div className="my-1 h-px bg-gray-100 dark:bg-white/10" />
                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-5 h-5 mr-3" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </Transition>
      </div>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={handleCancelDelete}
        className="max-w-md"
        showCloseButton={false}
      >
        <div className="p-6 text-left">
          <div className="flex items-start">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:h-10 sm:w-10">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="h-6 w-6 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                Confirm Deletion
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this item? This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
