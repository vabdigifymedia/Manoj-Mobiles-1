import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white">
      <section className="page-404 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl">
          <div className="text-center">
            {/* 404 Animation */}
            <div
              className="four-zero-four-bg relative mx-auto h-[400px] w-full max-w-4xl"
              aria-label="404"
            >
              <h1 className="absolute inset-0 flex items-center justify-center pt-1 text-[80px] font-bold text-[#111]">
                404
              </h1>
            </div>

            {/* Content */}
            <div className="content-box-404 -mt-12 relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-[#222] sm:text-4xl">
                Look like you&apos;re lost
              </h2>

              <p className="mt-4 text-base text-gray-600 sm:text-lg">
                The page you are looking for is not available!
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex items-center rounded-md bg-[#39ac31] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#2f9229] hover:shadow-md"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}