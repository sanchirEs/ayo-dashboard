export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Хуудас олдсонгүй</h2>
      <p className="text-gray-600 mb-6">Таны хайсан хуудас олдсонгүй эсвэл шилжсэн байж болно.</p>
      <a href="/" className="tf-button style-1">
        Нүүр хуудас руу буцах
      </a>
    </div>
  );
}
