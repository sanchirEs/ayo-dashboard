import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ThemeSwitch = dynamic(() => import("../elements/ThemeSwitch"), {
  ssr: false,
});

export default function Offcanvas({ isOffcanvas, handleOffcanvas }) {
  const [isTab, setIsTab] = useState(1);
  const [showTestElements, setShowTestElements] = useState(false);

  // Apply static styles on component mount
  useEffect(() => {
    document.body.classList.add('layout-full-width');
    document.body.classList.add('menu-style2');
    document.body.classList.add('header-fixed');
    document.documentElement.style.setProperty('--primary-color', '#2377FC');
    document.documentElement.style.setProperty('--background-color', '#F2F7FB');
  }, []);

  const handleTab = (i) => {
    setIsTab(i);
  };

  const toggleTestElements = () => {
    setShowTestElements(!showTestElements);
  };

  return (
    <>
      <div
        className={`offcanvas offcanvas-end ${isOffcanvas ? "show" : ""}`}
        tabIndex={-1}
        id="offcanvasRight"
        style={{ visibility: "visible" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="offcanvas-header">
          <h6 id="offcanvasRightLabel">Settings</h6>
          <button
            type="button"
            className="btn-close text-reset"
            onClick={handleOffcanvas}
          />
        </div>
        <div className="offcanvas-body">
          <div className="widget-tabs">
            <ul className="widget-menu-tab style-1">
              <li
                className={`item-title ${isTab === 1 ? "active" : ""}`}
                onClick={() => handleTab(1)}
              >
                <span className="inner">
                  <div className="body-title">Theme Style</div>
                </span>
              </li>
              <li
                className={`item-title ${isTab === 2 ? "active" : ""}`}
                onClick={() => handleTab(2)}
              >
                <span className="inner">
                  <div className="body-title">Theme Colors</div>
                </span>
              </li>
            </ul>
            <div className="widget-content-tab">
              <div
                className={`widget-content-inner ${isTab === 1 ? "active" : ""}`}
                style={{ display: `${isTab === 1 ? "block" : "none"}` }}
              >
                <form className="form-theme-style">
                  <fieldset className="theme-dark-light">
                    <div className="body-title mb-5">Theme color mode:</div>
                    <ThemeSwitch radioBtn />
                  </fieldset>
                  <fieldset>
                    <div className="body-title mb-5">Static Settings:</div>
                    <ul>
                      <li>Layout: Full width</li>
                      <li>Menu: Fixed</li>
                      <li>Header: Fixed</li>
                      <li>Loader: Enabled</li>
                    </ul>
                  </fieldset>
                </form>
              </div>
              <div
                className={`widget-content-inner ${isTab === 2 ? "active" : ""}`}
                style={{ display: `${isTab === 2 ? "block" : "none"}` }}
              >
                <form className="form-theme-color">
                  <fieldset>
                    <div className="body-title mb-10">Static Color Settings:</div>
                    <ul>
                      <li>Menu Background: White</li>
                      <li>Header Background: White</li>
                      <li>Theme Primary Color: #2377FC</li>
                      <li>Theme Background Color: #F2F7FB</li>
                    </ul>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleTestElements}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            {showTestElements ? "Hide Test Elements" : "Show Test Elements"}
          </button>
        </div>
      </div>

      {showTestElements && (
        <div className="fixed top-20 left-20 z-50 p-4 bg-white shadow-lg rounded">
          <h3 className="text-lg font-bold mb-2">Test Elements</h3>
          <div className="flex flex-col space-y-2">
            <div className="w-full h-10 bg-[var(--primary-color)] text-white flex items-center justify-center">
              Primary Color
            </div>
            <div className="w-full h-10 bg-[var(--background-color)] border border-gray-300 flex items-center justify-center">
              Background Color
            </div>
            <div className="w-full h-10 bg-white border border-gray-300 flex items-center justify-center">
              Menu/Header Background (White)
            </div>
          </div>
        </div>
      )}

      {isOffcanvas && (
        <div className="modal-backdrop fade show" onClick={handleOffcanvas} />
      )}
    </>
  );
}