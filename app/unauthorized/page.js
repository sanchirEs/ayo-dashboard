"use client";

import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Unauthorized() {
  const { data: session } = useSession();

  return (
    <Layout breadcrumbTitleParent="Алдаа" breadcrumbTitle="Зөвшөөрөлгүй">
      <div className="wg-box">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6">
            <i className="icon-shield-off text-6xl text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Хандалт хязгаарлагдсан
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 max-w-md">
            Та энэ хуудсанд хандах зөвшөөрөлгүй байна. Таны одоогийн эрх:{" "}
            <span className="font-semibold text-blue-600">
              {session?.user?.role || "Тодорхойгүй"}
            </span>
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Хэрэв энэ алдаа гэж үзэж байвал, админтай холбогдоно уу.
            </p>
            
            <div className="flex gap-4">
              <Link 
                href="/" 
                className="tf-button style-1"
              >
                <i className="icon-home mr-2" />
                Хяналтын самбар руу
              </Link>
              
              <Link 
                href="/login" 
                className="tf-button style-2"
              >
                <i className="icon-log-out mr-2" />
                Гарах
              </Link>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Эрхийн түвшин:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>CUSTOMER:</strong> Үндсэн хэрэглэгчийн хандалт</li>
              <li><strong>VENDOR:</strong> Бараа болон захиалгын удирдлага</li>
              <li><strong>ADMIN:</strong> Хэрэглэгч болон системийн удирдлага</li>
              <li><strong>SUPERADMIN:</strong> Бүрэн системийн хандалт</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}