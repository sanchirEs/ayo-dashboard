"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Menu() {
  const router = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    const accordionRoutes = {
      "/": 1,
      // '/home-2': 1,
      "/home-3": 1,
      // '/home-4': 1,
      // '/home-boxed': 1,
      // '/home-menu-icon-hover': 1,
      // '/home-menu-icon-default': 1,
      "/add-product": 2,
      "/product-list": 2,
      // '/product-detail-1': 2,
      // '/product-detail-2': 2,
      // '/product-detail-3': 2,
      "/category-list": 3,
      "/new-category": 3,
      "/attributes": 4,
      "/attributes/new": 4,
      "/tags": 6,
      "/add-tags": 6,
      "/hierarchical-tags": 6,
      "/brand-list": 13,
      "/new-brand": 13,
      "/edit-brand": 13,
      "/brand-detail": 13,
      "/order-list": 5,
      "/pickup-orders": 5,
      "/order-detail": 5,
      "/order-tracking": 5,
      "/import-orders": 5,
      "/product-orders": 5,
      "/pickup-logs": 5,
      "/delivery": 12,
      "/pickup-pins": 12,
      "/coupons": 7,
      "/new-coupon": 7,
      "/campaigns": 11,
      "/new-campaign": 11,
      "/discounts": 8,
      "/flash-sale": 8,
      "/sales": 9,
      "/all-user": 10,
      "/add-new-user": 10,
      "/sms-broadcast": 0,
      "/login": 10,
      "/sign-up": 10,
      // '/all-roles': 7,
      // '/create-role': 7,
      // '/gallery': 0,
      "/report": 0,
      // '/countries': 8,
      // '/states': 8,
      // '/cities': 8,
      "/setting": 0,
      "/store-settings": 0,
      "/store-locations": 0,
      "/store-locations/new": 0,
      // '/list-page': 9,
      // '/new-page': 9,
      // '/edit-page': 9,
      // "/components": 0,
      "/faq": 10,
      "/privacy-policy": 10,
    };

    // Check if the current path is in the object of accordion routes and set the activeAccordion state accordingly
    if (accordionRoutes.hasOwnProperty(router)) {
      setActiveAccordion(accordionRoutes[router]);
    } else {
      setActiveAccordion(null);
    }
  }, [router]);

  const handleAccordion = (key) => {
    setActiveAccordion((prevState) => (prevState === key ? null : key));
  };

  const isSubMenuItemActive = (path) => {
    return router === path;
  };

  // Branch (store-location) accounts see a limited menu: orders (view) + Pickup PIN.
  if (role === "BRANCH") {
    return (
      <div className="center">
        <div className="center-item">
          <div className="center-heading">Салбар</div>
          <ul className="menu-list">
            <li
              className={`menu-item ${router === "/order-list" ? "active" : ""}`}
            >
              <Link
                href="/order-list"
                className={isSubMenuItemActive("/order-list") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-file-plus" />
                </div>
                <div className="text">Захиалгын жагсаалт</div>
              </Link>
            </li>
            <li
              className={`menu-item ${router === "/pickup-orders" ? "active" : ""}`}
            >
              <Link
                href="/pickup-orders"
                className={isSubMenuItemActive("/pickup-orders") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-shopping-bag" />
                </div>
                <div className="text">🏬 Очиж авах захиалга</div>
              </Link>
            </li>
            <li
              className={`menu-item ${router === "/pickup-pins" ? "active" : ""}`}
            >
              <Link
                href="/pickup-pins"
                className={isSubMenuItemActive("/pickup-pins") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-truck" />
                </div>
                <div className="text">Pickup PIN</div>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="center">
      <div className="center-item">
        <div className="center-heading">Админ Самбар</div>
        <ul className="menu-list">
          <li className={`menu-item ${router === "/" ? "active" : ""}`}>
            <Link href="/" className={isSubMenuItemActive("/") ? "active" : ""}>
              <div className="icon">
                <i className="icon-grid" />
              </div>
              <div className="text">Хяналтын самбар</div>
            </Link>
          </li>
        </ul>
      </div>
      <div className="center-item">
        <div className="center-item">
          <div className="center-heading">Хуудсууд</div>
          <ul className="menu-list">
            <li
              className={`menu-item has-children ${
                activeAccordion === 5 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(5)}
              >
                <div className="icon">
                  <i className="icon-file-plus" />
                </div>
                <div className="text">Захиалга</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 5 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/order-list"
                    className={
                      isSubMenuItemActive("/order-list") ? "active" : ""
                    }
                  >
                    <div className="text">Захиалгын жагсаалт</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/pickup-orders"
                    className={
                      isSubMenuItemActive("/pickup-orders") ? "active" : ""
                    }
                  >
                    <div className="text">🏬 Очиж авах захиалга</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/import-orders"
                    className={
                      isSubMenuItemActive("/import-orders") ? "active" : ""
                    }
                  >
                    <div className="text">🌏 Импорт захиалга</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/product-orders"
                    className={
                      isSubMenuItemActive("/product-orders") ? "active" : ""
                    }
                  >
                    <div className="text">📦 Бүтээгдэхүүнээр</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/pickup-logs"
                    className={
                      isSubMenuItemActive("/pickup-logs") ? "active" : ""
                    }
                  >
                    <div className="text">📋 Pickup лог</div>
                  </Link>
                </li>
                {/* <li className="sub-menu-item">
                  <Link
                    href="/order-detail"
                    className={
                      isSubMenuItemActive("/order-detail") ? "active" : ""
                    }
                  >
                    <div className="text">Захиалгын дэлгэрэнгүй</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/order-tracking"
                    className={
                      isSubMenuItemActive("/order-tracking") ? "active" : ""
                    }
                  >
                    <div className="text">Захиалгын хяналт</div>
                  </Link>
                </li> */}
              </ul>
            </li>
            <li
              className={`menu-item has-children ${
                activeAccordion === 12 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(12)}
              >
                <div className="icon">
                  <i className="icon-truck" />
                </div>
                <div className="text">🚚 Хүргэлт</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 12 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/delivery"
                    className={
                      isSubMenuItemActive("/delivery") ? "active" : ""
                    }
                  >
                    <div className="text">Хүргэлт</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/pickup-pins"
                    className={
                      isSubMenuItemActive("/pickup-pins") ? "active" : ""
                    }
                  >
                    <div className="text">Pickup PIN</div>
                  </Link>
                </li>
              </ul>
            </li>
            <li
              className={`menu-item has-children ${
                activeAccordion === 2 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(2)}
              >
                <div className="icon">
                  <i className="icon-shopping-cart" />
                </div>
                <div className="text">Бараа (Ecommerce)</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 2 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/add-product"
                    className={
                      isSubMenuItemActive("/add-product") ? "active" : ""
                    }
                  >
                    <div className="text">Бараа нэмэх</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/product-list"
                    className={
                      isSubMenuItemActive("/product-list") ? "active" : ""
                    }
                  >
                    <div className="text">Барааны жагсаалт</div>
                  </Link>
                </li>
              </ul>
            </li>
            <li
              className={`menu-item ${activeAccordion === 8 ? "active" : ""}`}
            >
              <Link
                href="/flash-sale"
                className={isSubMenuItemActive("/flash-sale") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-zap" />
                </div>
                <div className="text">⚡ Flash Sale</div>
              </Link>
            </li>
            <li
              className={`menu-item ${router === "/sms-broadcast" ? "active" : ""}`}
            >
              <Link
                href="/sms-broadcast"
                className={isSubMenuItemActive("/sms-broadcast") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-message-square" />
                </div>
                <div className="text">📢 SMS Илгээх</div>
              </Link>
            </li>
            <li
              className={`menu-item has-children ${
                activeAccordion === 13 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(13)}
              >
                <div className="icon">
                  <i className="icon-award" />
                </div>
                <div className="text">Брэнд</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 13 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/brand-list"
                    className={
                      isSubMenuItemActive("/brand-list") ? "active" : ""
                    }
                  >
                    <div className="text">Брэндийн жагсаалт</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/new-brand"
                    className={
                      isSubMenuItemActive("/new-brand") ? "active" : ""
                    }
                  >
                    <div className="text">Брэнд нэмэх</div>
                  </Link>
                </li>
              </ul>
            </li>
            <li
              className={`menu-item has-children ${
                activeAccordion === 3 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(3)}
              >
                <div className="icon">
                  <i className="icon-layers" />
                </div>
                <div className="text">Ангилал</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 3 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/category-list"
                    className={
                      isSubMenuItemActive("/category-list") ? "active" : ""
                    }
                  >
                    <div className="text">Ангиллын жагсаалт</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/new-category"
                    className={
                      isSubMenuItemActive("/new-category") ? "active" : ""
                    }
                  >
                    <div className="text">Шинэ ангилал</div>
                  </Link>
                </li>
              </ul>
            </li>
            <li
              className={`menu-item has-children ${
                activeAccordion === 4 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(4)}
              >
                <div className="icon">
                  <i className="icon-sliders" />
                </div>
                <div className="text">Аттрибут</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 4 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/attributes"
                    className={
                      isSubMenuItemActive("/attributes") ? "active" : ""
                    }
                  >
                    <div className="text">Аттрибутууд</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/attributes/new"
                    className={
                      isSubMenuItemActive("/attributes/new") ? "active" : ""
                    }
                  >
                    <div className="text">Шинэ аттрибут</div>
                  </Link>
                </li>
              </ul>
            </li>
            <li
              className={`menu-item has-children ${
                activeAccordion === 6 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(6)}
              >
                <div className="icon">
                  <i className="icon-box" />
                </div>
                <div className="text">Таг</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 6 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/tags"
                    className={isSubMenuItemActive("/tags") ? "active" : ""}
                  >
                    <div className="text">Тагууд</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/add-tags"
                    className={isSubMenuItemActive("/add-tags") ? "active" : ""}
                  >
                    <div className="text">Таг нэмэх</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/hierarchical-tags"
                    className={
                      isSubMenuItemActive("/hierarchical-tags") ? "active" : ""
                    }
                  >
                    <div className="text">Нэмэлт ангилал</div>
                  </Link>
                </li>
              </ul>
            </li>

            <li
              className={`menu-item has-children ${
                activeAccordion === 7 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(7)}
              >
                <div className="icon">
                  <i className="icon-tag" />
                </div>
                <div className="text">Купон</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 7 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/coupons"
                    className={isSubMenuItemActive("/coupons") ? "active" : ""}
                  >
                    <div className="text">Бүх купон</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/new-coupon"
                    className={
                      isSubMenuItemActive("/new-coupon") ? "active" : ""
                    }
                  >
                    <div className="text">Шинэ купон</div>
                  </Link>
                </li>
              </ul>
            </li>
            {false && (
            <li
              className={`menu-item has-children ${
                activeAccordion === 11 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(11)}
              >
                <div className="icon">
                  <i className="icon-zap" />
                </div>
                <div className="text">Урамшуулал</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 11 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/campaigns"
                    className={
                      isSubMenuItemActive("/campaigns") ? "active" : ""
                    }
                  >
                    <div className="text">Бүх урамшуулал</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/new-campaign"
                    className={
                      isSubMenuItemActive("/new-campaign") ? "active" : ""
                    }
                  >
                    <div className="text">Шинэ урамшуулал үүсгэх</div>
                  </Link>
                </li>
              </ul>
            </li>
            )}
            {false && (
            <li
              className={`menu-item ${activeAccordion === 8 ? "active" : ""}`}
            >
              <Link
                href="/discounts"
                className={isSubMenuItemActive("/discounts") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-percent" />
                </div>
                <div className="text">Хөнгөлөлт</div>
              </Link>
            </li>
            )}
            {/** Removed from sidebar as requested
             *  Sales (/sales)
             */}
            {false && (
              <li
                className={`menu-item ${activeAccordion === 9 ? "active" : ""}`}
              >
                <Link
                  href="/sales"
                  className={isSubMenuItemActive("/sales") ? "active" : ""}
                >
                  <div className="icon">
                    <i className="icon-trending-up" />
                  </div>
                  <div className="text">Sales Analytics</div>
                </Link>
              </li>
            )}
            <li
              className={`menu-item has-children ${
                activeAccordion === 10 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(10)}
              >
                <div className="icon">
                  <i className="icon-user" />
                </div>
                <div className="text">Хэрэглэгч</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 10 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/all-user"
                    className={isSubMenuItemActive("/all-user") ? "active" : ""}
                  >
                    <div className="text">Бүх хэрэглэгч</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/add-new-user"
                    className={
                      isSubMenuItemActive("/add-new-user") ? "active" : ""
                    }
                  >
                    <div className="text">Шинэ хэрэглэгч нэмэх</div>
                  </Link>
                </li>
                {/** Removed from sidebar as requested
                 *  Authentication
                 *  - Login (/login)
                 *  - Sign Up (/sign-up)
                 */}
                {false && (
                  <>
                    <li className="sub-menu-item">
                      <Link
                        href="/login"
                        className={
                          isSubMenuItemActive("/login") ? "active" : ""
                        }
                      >
                        <div className="text">Login</div>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        href="/sign-up"
                        className={
                          isSubMenuItemActive("/sign-up") ? "active" : ""
                        }
                      >
                        <div className="text">Sign up</div>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </li>
            {/* <li
              className={`menu-item has-children ${
                activeAccordion === 7 ? "active" : ""
              }`}
            >
              <a
                className="menu-item-button"
                onClick={() => handleAccordion(7)}
              >
                <div className="icon">
                  <i className="icon-user-plus" />
                </div>
                <div className="text">Roles</div>
              </a>
              <ul
                className="sub-menu"
                style={{
                  display: `${activeAccordion === 7 ? "block" : "none"}`,
                }}
              >
                <li className="sub-menu-item">
                  <Link
                    href="/all-roles"
                    className={
                      isSubMenuItemActive("/all-roles") ? "active" : ""
                    }
                  >
                    <div className="text">All roles</div>
                  </Link>
                </li>
                <li className="sub-menu-item">
                  <Link
                    href="/create-role"
                    className={
                      isSubMenuItemActive("/create-role") ? "active" : ""
                    }
                  >
                    <div className="text">Create role</div>
                  </Link>
                </li>
              </ul>
            </li> */}
            {/* <li
              className={`menu-item ${router === "/gallery" ? "active" : ""}`}
            >
              <Link
                href="/gallery"
                className={isSubMenuItemActive("/gallery") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-image" />
                </div>
                <div className="text">Gallery</div>
              </Link>
            </li> */}
            {false && (
            <li className={`menu-item ${router === "/report" ? "active" : ""}`}>
              <Link
                href="/report"
                className={isSubMenuItemActive("/report") ? "active" : ""}
              >
                <div className="icon">
                  <i className="icon-pie-chart" />
                </div>
                <div className="text">Тайлан</div>
              </Link>
            </li>
            )}
          </ul>
        </div>
      </div>
      <div className="center-item">
        <div className="center-heading">Тохиргоо</div>
        <ul className="menu-list">
          <li className={`menu-item ${router === "/store-settings" ? "active" : ""}`}>
            <Link
              href="/store-settings"
              className={isSubMenuItemActive("/store-settings") ? "active" : ""}
            >
              <div className="icon">
                <i className="icon-settings" />
              </div>
              <div className="text">Дэлгүүрийн тохиргоо</div>
            </Link>
          </li>
          <li className={`menu-item ${router.startsWith("/store-locations") ? "active" : ""}`}>
            <Link
              href="/store-locations"
              className={router.startsWith("/store-locations") ? "active" : ""}
            >
              <div className="icon">
                <i className="icon-map-pin" />
              </div>
              <div className="text">Салбарууд</div>
            </Link>
          </li>
        </ul>
      </div>
      {false && (
      <div className="center-item">
        <div className="center-heading">Setting</div>
        <ul className="menu-list">
          <li className={`menu-item ${router === "/setting" ? "active" : ""}`}>
            <Link
              href="/setting"
              className={isSubMenuItemActive("/setting") ? "active" : ""}
            >
              <div className="icon">
                <i className="icon-settings" />
              </div>
              <div className="text">Тохиргоо</div>
            </Link>
          </li>
          {/* <li
            className={`menu-item has-children ${
              activeAccordion === 9 ? "active" : ""
            }`}
          >
            <a className="menu-item-button" onClick={() => handleAccordion(9)}>
              <div className="icon">
                <i className="icon-edit" />
              </div>
              <div className="text">Pages</div>
            </a>
            <ul
              className="sub-menu"
              style={{ display: `${activeAccordion === 9 ? "block" : "none"}` }}
            >
              <li className="sub-menu-item">
                <Link
                  href="/list-page"
                  className={isSubMenuItemActive("/list-page") ? "active" : ""}
                >
                  <div className="text">List page</div>
                </Link>
              </li>
              <li className="sub-menu-item">
                <Link
                  href="/new-page"
                  className={isSubMenuItemActive("/new-page") ? "active" : ""}
                >
                  <div className="text">New page</div>
                </Link>
              </li>
              <li className="sub-menu-item">
                <Link
                  href="/edit-page"
                  className={isSubMenuItemActive("/edit-page") ? "active" : ""}
                >
                  <div className="text">Edit page</div>
                </Link>
              </li>
            </ul>
          </li> */}
        </ul>
      </div>
      )}
    </div>
  );
}
