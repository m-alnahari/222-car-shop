function LogoMarquee() {
  const items = Array(20).fill('222')

  return (
    <div className="overflow-hidden border-y border-white/10 bg-[#050505] py-5">
      <div className="flex w-max animate-[marquee_20s_linear_infinite]">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center"
          >
            <span className="px-8 text-2xl font-semibold tracking-[0.3em] text-white/40">
              {item}
            </span>

            <span className="text-white/20">
              —
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LogoMarquee