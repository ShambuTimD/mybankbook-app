import React from "react";

const cardData = [
  {
    id: 1,
    title: "Card title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum",
    image: "/src/images/cards/card-01.png",
    linkText: "Read more",
    linkHref: "#",
    style: "grid", // grid for vertical image cards
  },
  {
    id: 2,
    title: "Card title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum",
    image: "/src/images/cards/card-02.png",
    linkText: "Read more",
    linkHref: "#",
    style: "grid",
  },
  {
    id: 3,
    title: "Card title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum",
    image: "/src/images/cards/card-03.png",
    linkText: "Card link",
    linkHref: "#",
    style: "flex", // horizontal layout
  },
  {
    id: 4,
    title: "Card title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum",
    image: "/src/images/cards/card-03.png",
    linkText: "Card link",
    linkHref: "#",
    style: "flex",
  },
  {
    id: 5,
    title: "Card title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum",
    linkText: "Read more",
    linkType: "button", // button style
    linkHref: "#",
    style: "link",
  },
  {
    id: 6,
    title: "Card title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum",
    linkText: "Card link",
    linkType: "text", // text + icon style
    linkHref: "#",
    style: "link",
  },
];

const Cards = () => {
  // Separate cards by style
  const gridCards = cardData.filter((c) => c.style === "grid");
  const flexCards = cardData.filter((c) => c.style === "flex");
  const linkCards = cardData.filter((c) => c.style === "link");

  return (
    <div className="space-y-10">
      {/* Grid Cards Section */}
      {gridCards.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Card with Image
            </h3>
          </div>
          <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {gridCards.map((card) => (
                <div key={card.id}>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-5 overflow-hidden rounded-lg">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <h4 className="mb-1 text-theme-xl font-medium text-gray-800 dark:text-white/90">
                      {card.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.description}
                    </p>
                    <a
                      href={card.linkHref}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                    >
                      {card.linkText}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Flex Cards Section */}
      {flexCards.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Horizontal Card with Image
            </h3>
          </div>
          <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {flexCards.map((card) => (
                <div key={card.id}>
                  <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-6">
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-40 h-32 object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h4 className="mb-1 text-theme-xl font-medium text-gray-800 dark:text-white/90">
                        {card.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {card.description}
                      </p>
                      <a
                        href={card.linkHref}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                      >
                        {card.linkText}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Link Only Cards Section */}
      {linkCards.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Card with link
            </h3>
          </div>
          <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {linkCards.map((card) => (
                <div key={card.id}>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h4 className="mb-1 text-theme-xl font-medium text-gray-800 dark:text-white/90">
                      {card.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.description}
                    </p>
                    {card.linkType === "button" ? (
                      <a
                        href={card.linkHref}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                      >
                        {card.linkText}
                      </a>
                    ) : (
                      <a
                        href={card.linkHref}
                        className="mt-4 inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
                      >
                        <svg
                          className="fill-current"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M6.88029 3.10905C8.54002 1.44932 11.231 1.44933 12.8907 3.10906C14.5504 4.76878 14.5504 7.45973 12.8907 9.11946L12.0654 9.94479L11.0047 8.88413L11.83 8.0588C12.904 6.98486 12.904 5.24366 11.83 4.16972C10.7561 3.09577 9.01489 3.09577 7.94095 4.16971L7.11562 4.99504L6.05496 3.93438L6.88029 3.10905ZM8.88339 11.0055L9.94405 12.0661L9.11946 12.8907C7.45973 14.5504 4.76878 14.5504 3.10905 12.8907C1.44933 11.231 1.44933 8.54002 3.10905 6.88029L3.93364 6.0557L4.9943 7.11636L4.16971 7.94095C3.09577 9.01489 3.09577 10.7561 4.16971 11.83C5.24366 12.904 6.98486 12.904 8.0588 11.83L8.88339 11.0055ZM9.94422 7.11599C10.2371 6.8231 10.2371 6.34823 9.94422 6.05533C9.65132 5.76244 9.17645 5.76244 8.88356 6.05533L6.05513 8.88376C5.76224 9.17665 5.76224 9.65153 6.05513 9.94442C6.34802 10.2373 6.8229 10.2373 7.11579 9.94442L9.94422 7.11599Z"
                          />
                        </svg>
                        {card.linkText}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
