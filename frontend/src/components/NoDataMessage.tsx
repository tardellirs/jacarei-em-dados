interface NoDataMessageProps {
  cdSetor: string
}

export function NoDataMessage({ cdSetor }: NoDataMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-400">
      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-40">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p className="text-sm font-medium text-slate-500">Sem dados demográficos</p>
      <p className="text-xs text-slate-400 text-center leading-relaxed">
        O setor <span className="font-mono font-semibold">{cdSetor}</span> não possui
        dados populacionais no Censo 2022.<br />
        Pode ser uma área industrial, corpo d'água ou zona sem residências.
      </p>
    </div>
  )
}
