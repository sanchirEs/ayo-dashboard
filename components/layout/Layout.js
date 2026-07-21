"use client";
import { useState } from "react";
import ProgressBar from "../elements/ProgressBar";
import Breadcrumb from "./Breadcrumb";
import Footer1 from "./Footer1";
import Header1 from "./Header1";
import Offcanvas from "./Offcanvas";
import Sidebar from "./Sidebar";

export default function Layout({
  breadcrumbTitleParent,
  breadcrumbTitle,
  pageTitle,
  children,
}) {
  // Moblile Menu
  const [isSidebar, setSidebar] = useState(false);
  const handleSidebar = () => setSidebar(!isSidebar);

  const [isOffcanvas, setIsOffcanvas] = useState(false);
  const handleOffcanvas = () => setIsOffcanvas(!isOffcanvas);

  return (
    <>
      <ProgressBar />
      <div id="wrapper">
        <div id="page">
          <div className={`layout-wrap ${isSidebar ? "full-width" : ""}`}>
            {isSidebar && (
              <div className="sidebar-backdrop" onClick={handleSidebar} />
            )}
            <Sidebar handleSidebar={handleSidebar} />
            <div className="section-content-right">
              <Header1
                isSidebar={isSidebar}
                handleSidebar={handleSidebar}
                handleOffcanvas={handleOffcanvas}
              />
              <div className="main-content">
                <div className="main-content-inner">
                  <div className="main-content-wrap">
                    {breadcrumbTitle && (
                      <Breadcrumb
                        breadcrumbTitle={breadcrumbTitle}
                        breadcrumbTitleParent={breadcrumbTitleParent}
                        pageTitle={pageTitle}
                      />
                    )}

                    {children}
                  </div>
                </div>
                <Footer1 />
              </div>
            </div>
          </div>
        </div>
        <Offcanvas
          isOffcanvas={isOffcanvas}
          handleOffcanvas={handleOffcanvas}
        />
      </div>
    </>
  );
}
