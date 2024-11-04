import Link from "next/link";

export default function DataTable() {
  return (
    <div className="wg-table table-all-user">
      <ul className="table-title flex gap20 mb-14">
        <li>
          <div className="body-title">User</div>
        </li>
        <li>
          <div className="body-title">Phone</div>
        </li>
        <li>
          <div className="body-title">Email</div>
        </li>
        <li>
          <div className="body-title">Action</div>
        </li>
      </ul>
      <ul className="flex flex-column">
        <li className="user-item gap14">
          <div className="image">
            <img src="/images/avatar/user-6.png" alt="" />
          </div>
          <div className="flex items-center justify-between gap20 flex-grow">
            <div className="name">
              <Link href="#" className="body-title-2">
                Kristin Watson
              </Link>
              <div className="text-tiny mt-3">Product name</div>
            </div>
            <div className="body-text">$1,452.500 </div>
            <div className="body-text">1,638</div>
            <div className="list-icon-function">
              <div className="item eye">
                <i className="icon-eye" />
              </div>
              <div className="item edit">
                <i className="icon-edit-3" />
              </div>
              <div className="item trash">
                <i className="icon-trash-2" />
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
