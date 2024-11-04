"use client";
import Link from "next/link";

export const columns = [
  {
    key: "name",
    label: "User",
    render: (name) => <Link href="#">{name}</Link>,
  },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  // Add other columns as needed
];
