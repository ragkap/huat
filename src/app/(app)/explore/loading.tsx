export default function ExploreLoading() {
  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Search</h1>
      </div>

      <div className="px-5 py-12 text-center">
        <p className="text-[#71717A] text-sm">Search stocks and investors above</p>
      </div>
    </div>
  );
}
