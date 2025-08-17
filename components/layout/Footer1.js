import Link from "next/link"

export default function Footer1() {
    return (
        <>

            <div className="bottom-page">
                <div className="body-text">Зохиогчийн эрх © {new Date().getFullYear()} AIM TRENDSETT LLC. Дизайныг хийсэн</div>
                <i className="icon-heart" />
                <div className="body-text">AYOCOSMETICS-ийн бүх эрх хуулиар хамгаалагдсан.</div>
            </div>

        </>
    )
}
