export function Header() {
  return (
    <header className="bg-[#1a3a5c] text-white px-4 py-2.5 flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span className="font-bold text-base leading-tight">
          Painel de Dados do Censo IBGE 2022 para Jacareí – SP
        </span>
      </div>
    </header>
  )
}
