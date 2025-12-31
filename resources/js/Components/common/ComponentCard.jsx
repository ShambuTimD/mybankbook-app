import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";

const ComponentCard = ({
  title,
  children,
  className = "",
  desc = "",
  url = "",
  urlText = "",
  urlIcon = null,
  actions = null,   // ⭐ NEW PROP
  onClick = null,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-300 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5 flex justify-between items-center dark:border-gray-400 dark:bg-gray-800">
        
        {/* LEFT SIDE */}
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>

        {/* RIGHT SIDE BUTTONS */}
        <div className="flex items-center gap-3">
          
          {/* EXTRA ACTION BUTTONS */}
          {actions && <>{actions}</>}

          {/* DEFAULT SINGLE LINK BUTTON */}
          {url && (
            <Link
              href={url}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              <FontAwesomeIcon icon={urlIcon ?? faPlus} className="mr-1" />
              {urlText}
            </Link>
          )}

        </div>
      </div>

      {/* Card Body */}
      <div className="border-t border-gray-100 dark:border-gray-800 sm:p-6" onClick={onClick}>
        <div className="space-y-0">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
