import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F7F7F3] text-[#1B1D1A]">
      <div className="max-w-md w-full bg-white border border-[#E1E4DC] rounded-xl p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[#E7B900]/15 text-[#8F6A00] flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          404
        </div>
        <h2 className="text-xl font-bold text-[#1B1D1A] mb-2">Feed or Page Not Found</h2>
        <p className="text-sm text-[#747A73] mb-6">
          The requested camera stream, telemetry channel, or workspace view does not exist or has been relocated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs tracking-wide uppercase rounded-lg transition-colors shadow-xs"
        >
          Return to Live Workspace
        </Link>
      </div>
    </div>
  );
}
