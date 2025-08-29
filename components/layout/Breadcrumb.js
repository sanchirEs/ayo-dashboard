import Link from "next/link";

export default function Breadcrumb({
  breadcrumbTitleParent,
  breadcrumbTitle,
  pageTitle,
}) {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <div className="flex items-center flex-wrap justify-between gap20 mb-27">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            title="Go back"
          >
            <i className="icon-arrow-left text-blue-600" />
            <span className="text-tiny text-gray-700">Буцах</span>
          </button>
          <h3>{pageTitle ? pageTitle : " "}</h3>
        </div>
        <ul className="breadcrumbs flex items-center flex-wrap justify-start gap10">
          <li>
            <Link href="/">
              <div className="text-tiny">Хяналтын самбар</div>
            </Link>
          </li>
          <li>
            <i className="icon-chevron-right" />
          </li>
          <li>
            <Link href="#">
              <div className="text-tiny">{breadcrumbTitleParent || " "}</div>
            </Link>
          </li>
          <li>
            <i className="icon-chevron-right" />
          </li>
          <li>
            <div className="text-tiny">{breadcrumbTitle}</div>
          </li>
        </ul>
      </div>
    </>
  );
}
