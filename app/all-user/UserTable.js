"use server";
import Link from "next/link";
import getToken from "@/lib/GetTokenServer";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { AuthenticationError } from "@/lib/api/error-handler";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";
export default async function DataTable({ searchParams }) {
  const TOKEN = await getToken();
  console.log("spa", searchParams);
  const params = new URLSearchParams(searchParams);
  let response;
  try {
    response = await fetchWithAuthHandling(
      `${require("@/lib/api/env").getBackendUrl()}/api/v1/users/getusers?${params.toString()}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      },
      "UserTable.getUsers"
    );
  } catch (err) {
    if (err instanceof AuthenticationError) {
      redirect("/login");
    }
    notFound();
  }
  const data = await response.json();
  if (!response.ok) {
    const message =
      data.message || "An error has occured. Please try again later";
    return <div>{message}</div>;
  }
  const users = data.data;
  const pagination = data.pagination;
  console.log(users);

  return (
    <>
      <div className="wg-table table-all-user">
        <ul className="table-title flex gap20 mb-14">
          <li>
            <div className="body-title">Хэрэглэгчийн нэр</div>
          </li>
          <li>
            <div className="body-title">И-мэйл</div>
          </li>
          <li>
            <div className="body-title">Нэр</div>
          </li>
          <li>
            <div className="body-title">Утасны дугаар</div>
          </li>
          <li>
            <div className="body-title">Бүртгэгдсэн огноо</div>
          </li>
          <li>
            <div className="body-title">Үйлдлүүд</div>
          </li>
        </ul>
        <ul className="flex flex-column">
          {users.map((user) => (
            <li className="user-item gap14" key={user.id}>
              <div className="image">
                <img
                  src={user.image ? user.image : "/images/avatar/user-6.png"}
                  alt=""
                />
              </div>
              <div className="flex items-center justify-between gap20 flex-grow">
                <div className="name">
                  <Link href="#" className="body-title-2">
                    {user.username}
                  </Link>
                  <div className="text-tiny mt-3">{user.role}</div>
                </div>
                <div className="body-text">{user.email}</div>
                <div className="body-text">
                  {user.firstName} {user.lastName}
                </div>
                <div className="body-text">{user.telephone}</div>
                <div className="body-text">{user.createdAt}</div>
                <div className="list-icon-function">
                  <div className="item edit">
                    <i className="icon-edit-3" />
                  </div>
                  <div className="item trash">
                    <i className="icon-trash-2" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
      />
    </>
  );
}
