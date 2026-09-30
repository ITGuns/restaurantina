export default function MenuLoading() {
  return (
    <div className="bg-cream-100 pt-32 md:pt-40">
      <div className="container-site space-y-4 pb-20">
        <div className="skeleton h-12 w-2/3 rounded-full" />
        <div className="skeleton h-6 w-1/3 rounded-full" />
        <div className="mt-10 grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-[22px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
