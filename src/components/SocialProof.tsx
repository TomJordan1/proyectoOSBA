const TOOLS = ['VS CODE', 'GITHUB', 'SLACK', 'FIGMA', 'NOTION']

export default function SocialProof() {
  return (
    <section className="py-10 border-y border-slate-800/60 bg-slate-950/40 relative z-10">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-6">
        <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
          Utilizado por creadores y desarrolladores en herramientas como
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
          {TOOLS.map((tool) => (
            <span key={tool} className="font-bold text-slate-400 text-lg">
              {tool}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
