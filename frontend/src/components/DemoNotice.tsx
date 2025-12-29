export default function DemoNotice() {
  return (
    <div className="bg-gradient-to-r from-[#5FA8A6] to-[#A8B968] text-white px-4 py-3 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Demo Mode</p>
            <p className="text-sm opacity-90">Backend not connected. Deploy to Render.com to enable full functionality.</p>
          </div>
        </div>
        <a 
          href="https://github.com/canboigay/aid-inventory-system/blob/main/DEPLOY_NOW.md" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          Deploy Guide →
        </a>
      </div>
    </div>
  );
}
